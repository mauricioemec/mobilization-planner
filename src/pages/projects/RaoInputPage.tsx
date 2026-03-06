import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectStore } from '../../stores/useProjectStore'
import { useRaoStore } from '../../stores/useRaoStore'
import { useDeckLayoutStore } from '../../stores/useDeckLayoutStore'
import { useEquipmentStore } from '../../stores/useEquipmentStore'
import { Button } from '../../components/ui/button'
import { Skeleton } from '../../components/ui/skeleton'
import { RaoTable, type RaoRow } from '../../components/rao/RaoTable'
import { PasteDialog } from '../../components/rao/PasteDialog'
import { RaoPlots } from '../../components/rao/RaoPlots'
import { CraneTipResults } from '../../components/rao/CraneTipResults'
import type { EquipmentLibrary } from '../../types/database'

const DIRECTIONS = [
  { value: 0, label: '0° — Head seas' },
  { value: 45, label: '45° — Bow quartering' },
  { value: 90, label: '90° — Beam seas (starboard)' },
  { value: 135, label: '135° — Stern quartering' },
  { value: 180, label: '180° — Following seas' },
  { value: 225, label: '225° — Stern quartering (port)' },
  { value: 270, label: '270° — Beam seas (port)' },
  { value: 315, label: '315° — Bow quartering (port)' },
]

const BEAM_SEAS_PRESET: RaoRow[] = [
  { wave_period_s: 4, heave_amplitude_m_per_m: 0.02, heave_phase_deg: 0, roll_amplitude_deg_per_m: 0.5, roll_phase_deg: 0, pitch_amplitude_deg_per_m: 0.10, pitch_phase_deg: 0 },
  { wave_period_s: 5, heave_amplitude_m_per_m: 0.05, heave_phase_deg: 10, roll_amplitude_deg_per_m: 1.2, roll_phase_deg: 15, pitch_amplitude_deg_per_m: 0.25, pitch_phase_deg: 12 },
  { wave_period_s: 6, heave_amplitude_m_per_m: 0.10, heave_phase_deg: 25, roll_amplitude_deg_per_m: 2.1, roll_phase_deg: 30, pitch_amplitude_deg_per_m: 0.50, pitch_phase_deg: 28 },
  { wave_period_s: 7, heave_amplitude_m_per_m: 0.20, heave_phase_deg: 45, roll_amplitude_deg_per_m: 3.5, roll_phase_deg: 50, pitch_amplitude_deg_per_m: 0.80, pitch_phase_deg: 42 },
  { wave_period_s: 8, heave_amplitude_m_per_m: 0.35, heave_phase_deg: 65, roll_amplitude_deg_per_m: 4.8, roll_phase_deg: 72, pitch_amplitude_deg_per_m: 1.10, pitch_phase_deg: 60 },
  { wave_period_s: 9, heave_amplitude_m_per_m: 0.55, heave_phase_deg: 85, roll_amplitude_deg_per_m: 5.5, roll_phase_deg: 88, pitch_amplitude_deg_per_m: 1.30, pitch_phase_deg: 78 },
  { wave_period_s: 10, heave_amplitude_m_per_m: 0.70, heave_phase_deg: 100, roll_amplitude_deg_per_m: 5.2, roll_phase_deg: 98, pitch_amplitude_deg_per_m: 1.20, pitch_phase_deg: 90 },
  { wave_period_s: 11, heave_amplitude_m_per_m: 0.80, heave_phase_deg: 115, roll_amplitude_deg_per_m: 4.5, roll_phase_deg: 108, pitch_amplitude_deg_per_m: 1.00, pitch_phase_deg: 100 },
  { wave_period_s: 12, heave_amplitude_m_per_m: 0.85, heave_phase_deg: 130, roll_amplitude_deg_per_m: 3.8, roll_phase_deg: 120, pitch_amplitude_deg_per_m: 0.80, pitch_phase_deg: 112 },
  { wave_period_s: 13, heave_amplitude_m_per_m: 0.82, heave_phase_deg: 145, roll_amplitude_deg_per_m: 3.0, roll_phase_deg: 135, pitch_amplitude_deg_per_m: 0.60, pitch_phase_deg: 125 },
  { wave_period_s: 14, heave_amplitude_m_per_m: 0.75, heave_phase_deg: 160, roll_amplitude_deg_per_m: 2.5, roll_phase_deg: 150, pitch_amplitude_deg_per_m: 0.45, pitch_phase_deg: 140 },
  { wave_period_s: 15, heave_amplitude_m_per_m: 0.65, heave_phase_deg: 172, roll_amplitude_deg_per_m: 2.0, roll_phase_deg: 162, pitch_amplitude_deg_per_m: 0.35, pitch_phase_deg: 155 },
  { wave_period_s: 16, heave_amplitude_m_per_m: 0.55, heave_phase_deg: 180, roll_amplitude_deg_per_m: 1.6, roll_phase_deg: 170, pitch_amplitude_deg_per_m: 0.28, pitch_phase_deg: 165 },
  { wave_period_s: 18, heave_amplitude_m_per_m: 0.40, heave_phase_deg: 185, roll_amplitude_deg_per_m: 1.0, roll_phase_deg: 178, pitch_amplitude_deg_per_m: 0.18, pitch_phase_deg: 175 },
  { wave_period_s: 20, heave_amplitude_m_per_m: 0.30, heave_phase_deg: 188, roll_amplitude_deg_per_m: 0.7, roll_phase_deg: 182, pitch_amplitude_deg_per_m: 0.12, pitch_phase_deg: 180 },
]

export default function RaoInputPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const activeProject = useProjectStore((s) => s.activeProject)
  const raoStore = useRaoStore()
  const deckStore = useDeckLayoutStore()
  const equipStore = useEquipmentStore()

  const [direction, setDirection] = useState(270)
  const [rows, setRows] = useState<RaoRow[]>([])
  const [pasteOpen, setPasteOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const vessel = activeProject?.vessel_snapshot?.vessel ?? null

  // Load data on mount
  useEffect(() => {
    if (!projectId) return
    void raoStore.loadRaos(projectId)
    void deckStore.loadProjectEquipment(projectId)
    void equipStore.loadEquipment()
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  // When stored entries or direction changes, populate the table
  useEffect(() => {
    const filtered = raoStore.entries.filter((e) => e.wave_direction_deg === direction)
    if (filtered.length > 0) {
      setRows(filtered.map((e) => ({
        wave_period_s: e.wave_period_s,
        heave_amplitude_m_per_m: e.heave_amplitude_m_per_m,
        heave_phase_deg: e.heave_phase_deg,
        roll_amplitude_deg_per_m: e.roll_amplitude_deg_per_m,
        roll_phase_deg: e.roll_phase_deg,
        pitch_amplitude_deg_per_m: e.pitch_amplitude_deg_per_m,
        pitch_phase_deg: e.pitch_phase_deg,
      })))
    } else {
      setRows([])
    }
    setSaved(false)
  }, [raoStore.entries, direction])

  const libById = useMemo<Record<string, EquipmentLibrary>>(() => {
    const m: Record<string, EquipmentLibrary> = {}
    equipStore.items.forEach((e) => { m[e.id] = e })
    return m
  }, [equipStore.items])

  // Build the full entry set: current direction rows merged with other directions from store
  function buildFullEntries() {
    const otherDirs = raoStore.entries
      .filter((e) => e.wave_direction_deg !== direction)
      .map((e) => ({
        wave_direction_deg: e.wave_direction_deg,
        wave_period_s: e.wave_period_s,
        heave_amplitude_m_per_m: e.heave_amplitude_m_per_m,
        heave_phase_deg: e.heave_phase_deg,
        roll_amplitude_deg_per_m: e.roll_amplitude_deg_per_m,
        roll_phase_deg: e.roll_phase_deg,
        pitch_amplitude_deg_per_m: e.pitch_amplitude_deg_per_m,
        pitch_phase_deg: e.pitch_phase_deg,
      }))
    const currentDir = rows.map((r) => ({
      wave_direction_deg: direction,
      ...r,
    }))
    return [...otherDirs, ...currentDir]
  }

  async function handleSave() {
    if (!projectId) return
    const fullEntries = buildFullEntries().filter((r) => r.wave_period_s > 0)
    await raoStore.saveRaos(projectId, fullEntries)
    setSaved(true)
  }

  function handlePreset() {
    setRows(BEAM_SEAS_PRESET)
    setDirection(270)
    setSaved(false)
  }

  function handlePasteImport(pastedRows: RaoRow[]) {
    setRows(pastedRows)
    setSaved(false)
  }

  function handleClear() {
    setRows([])
    setSaved(false)
  }

  if (raoStore.isLoading) {
    return (
      <div className="overflow-auto p-6 space-y-6">
        <Skeleton className="h-7 w-56" />
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-52" />
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-24" />)}
          </div>
          <div className="rounded border border-gray-200 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-2 border-b border-gray-100 px-3 py-2">
                {Array.from({ length: 7 }).map((__, j) => <Skeleton key={j} className="h-4 flex-1" />)}
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded" />
      </div>
    )
  }

  return (
    <div className="overflow-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">RAO & Crane Tip Motion</h1>

      {/* ── RAO Input Section ──────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Wave Direction</label>
          <select
            value={direction}
            onChange={(e) => setDirection(parseInt(e.target.value))}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {DIRECTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => setPasteOpen(true)}>
              Paste from Clipboard
            </Button>
            <Button variant="outline" size="sm" onClick={handlePreset}>
              Quick Preset (Beam Seas)
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
            <Button size="sm" onClick={handleSave} disabled={raoStore.isSaving}>
              {raoStore.isSaving ? 'Saving…' : 'Save RAOs'}
            </Button>
          </div>
        </div>

        {saved && <p className="text-xs text-green-600">RAO data saved successfully.</p>}
        {raoStore.error && <p className="text-xs text-red-600">{raoStore.error}</p>}

        <RaoTable rows={rows} onChange={(r) => { setRows(r); setSaved(false) }} />
      </section>

      {/* ── RAO Plots ──────────────────────────────────────── */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">RAO Plots</h2>
        <RaoPlots entries={raoStore.entries} />
      </section>

      {/* ── Crane Tip Motion Results ───────────────────────── */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">Crane Tip Motion Results</h2>
        {vessel ? (
          <CraneTipResults
            raoEntries={raoStore.entries}
            placed={deckStore.items}
            libById={libById}
            vessel={vessel}
          />
        ) : (
          <div className="rounded border border-gray-200 px-4 py-6 text-center text-xs text-gray-400">
            No vessel data available
          </div>
        )}
      </section>

      <PasteDialog open={pasteOpen} onClose={() => setPasteOpen(false)} onPaste={handlePasteImport} />
    </div>
  )
}
