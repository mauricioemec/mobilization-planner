import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectStore } from '../stores/useProjectStore'
import { useDeckLayoutStore } from '../stores/useDeckLayoutStore'
import { useEquipmentStore } from '../stores/useEquipmentStore'
import { validatePlacement, type ValidationResult, type EquipPlacement } from '../lib/calculations/deckValidation'
import type { EquipmentLibrary } from '../types/database'

const SNAP_SIZE = 0.5

type UndoEntry = { id: string; x: number; y: number }

export type DeckLayoutState = ReturnType<typeof useDeckLayout>

export function useDeckLayout() {
  const { id: projectId } = useParams<{ id: string }>()
  const activeProject = useProjectStore((s) => s.activeProject)
  const deckStore = useDeckLayoutStore()
  const equipStore = useEquipmentStore()

  const [showGrid, setShowGrid] = useState(true)
  const [snap, setSnap] = useState(false)
  const undoStack = useRef<UndoEntry[]>([])

  // Load deck placements and equipment library on mount
  useEffect(() => {
    if (!projectId) return
    deckStore.loadProjectEquipment(projectId)
    equipStore.loadEquipment()
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Delete-key and Ctrl+Z keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'Delete' && deckStore.selectedEquipmentId) {
        handleRemove(deckStore.selectedEquipmentId)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deckStore.selectedEquipmentId]) // eslint-disable-line react-hooks/exhaustive-deps

  const vessel = activeProject?.vessel_snapshot?.vessel ?? null
  const barriers = activeProject?.vessel_snapshot?.barriers ?? []
  const zones = activeProject?.vessel_snapshot?.deck_load_zones ?? []

  const libById = useMemo<Record<string, EquipmentLibrary>>(() => {
    const m: Record<string, EquipmentLibrary> = {}
    equipStore.items.forEach((e) => { m[e.id] = e })
    return m
  }, [equipStore.items])

  // Build placement structs (for validation)
  const placements = useMemo<Array<EquipPlacement & { id: string }>>(() =>
    deckStore.items.flatMap((pe) => {
      const eq = libById[pe.equipment_id]
      if (!eq) return []
      return [{ id: pe.id, cx: pe.deck_pos_x, cy: pe.deck_pos_y, halfL: eq.length_m / 2, halfW: eq.width_m / 2, rotDeg: pe.deck_rotation_deg, weightT: eq.dry_weight_t }]
    }),
  [deckStore.items, libById])

  // Recompute validation for all placed items
  const validationMap = useMemo<Record<string, ValidationResult>>(() => {
    if (!vessel) return {}
    const map: Record<string, ValidationResult> = {}
    for (const p of placements) {
      const others = placements.filter((o) => o.id !== p.id)
      map[p.id] = validatePlacement(p, vessel.deck_length_m, vessel.deck_width_m, barriers, zones, others)
    }
    return map
  }, [placements, vessel, barriers, zones])

  function snapCoord(v: number) {
    return snap ? Math.round(v / SNAP_SIZE) * SNAP_SIZE : v
  }

  const handleDrop = useCallback(async (equipId: string, rawX: number, rawY: number) => {
    if (!projectId) return
    await deckStore.addToProject({
      project_id: projectId,
      equipment_id: equipId,
      label: null,
      deck_pos_x: snapCoord(rawX),
      deck_pos_y: snapCoord(rawY),
      deck_rotation_deg: 0,
      overboard_pos_x: null,
      overboard_pos_y: null,
      crane_slew_deck_deg: null,
      crane_boom_angle_deck_deg: null,
      crane_radius_deck_m: null,
      crane_capacity_deck_t: null,
      crane_slew_overboard_deg: null,
      crane_boom_angle_overboard_deg: null,
      crane_radius_overboard_m: null,
      crane_capacity_overboard_t: null,
      deck_load_ok: null,
      capacity_check_deck_ok: null,
      capacity_check_overboard_ok: null,
    })
  }, [projectId, deckStore, snap]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMove = useCallback(async (id: string, rawX: number, rawY: number) => {
    const item = deckStore.items.find((i) => i.id === id)
    if (item) undoStack.current = [...undoStack.current.slice(-19), { id, x: item.deck_pos_x, y: item.deck_pos_y }]
    const x = snapCoord(rawX)
    const y = snapCoord(rawY)
    // Compute deck_load_ok inline using current validation (optimistic)
    const eq = libById[deckStore.items.find((i) => i.id === id)?.equipment_id ?? '']
    const others = placements.filter((p) => p.id !== id)
    const vr = eq && vessel ? validatePlacement({ cx: x, cy: y, halfL: eq.length_m / 2, halfW: eq.width_m / 2, rotDeg: deckStore.items.find((i) => i.id === id)?.deck_rotation_deg ?? 0, weightT: eq.dry_weight_t }, vessel.deck_length_m, vessel.deck_width_m, barriers, zones, others) : null
    await deckStore.updatePosition(id, { deck_pos_x: x, deck_pos_y: y, deck_load_ok: vr?.deckLoadOk ?? null })
  }, [deckStore, libById, placements, vessel, barriers, zones, snap]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRotate = useCallback(async (id: string, deg: number) => {
    await deckStore.updateRotation(id, deg)
  }, [deckStore])

  const handleRemove = useCallback(async (id: string) => {
    const eq = libById[deckStore.items.find((i) => i.id === id)?.equipment_id ?? '']
    const name = eq?.name ?? 'this equipment'
    if (!window.confirm(`Remove "${name}" from deck?\nThis will also delete any analysis results for this item.`)) return
    await deckStore.removeFromProject(id)
  }, [deckStore, libById])

  const handleUndo = useCallback(async () => {
    const entry = undoStack.current.pop()
    if (!entry) return
    await deckStore.updatePosition(entry.id, { deck_pos_x: entry.x, deck_pos_y: entry.y })
  }, [deckStore])

  return {
    vessel, barriers, zones,
    placed: deckStore.items,
    library: equipStore.items,
    libById,
    validationMap,
    selectedId: deckStore.selectedEquipmentId,
    setSelectedId: deckStore.setSelectedEquipment,
    showGrid, setShowGrid,
    snap, setSnap,
    handleDrop, handleMove, handleRotate, handleRemove, handleUndo,
    isLoading: deckStore.isLoading || equipStore.isLoading,
  }
}
