import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  loadVessel,
  loadVesselBarriers,
  loadDeckLoadZones,
  saveVessel,
  saveVesselBarriers,
  saveDeckLoadZones,
} from '../lib/supabase/vesselService'
import { vesselSchema } from '../validation/schemas'
import type { Vessel, VesselType, CraneType } from '../types/database'

// ─── Row types (string-valued for input binding) ──────────────────────────────

export type VesselFormState = {
  name: string
  vessel_type: string
  description: string
  deck_length_m: string
  deck_width_m: string
  crane_type: string
  crane_pedestal_x: string
  crane_pedestal_y: string
  crane_pedestal_height_m: string
  crane_boom_length_m: string
  crane_jib_length_m: string
  crane_slew_min_deg: string
  crane_slew_max_deg: string
}

export type BarrierRow = {
  _key: string
  name: string
  x_m: string
  y_m: string
  length_m: string
  width_m: string
  height_m: string
}

export type ZoneRow = {
  _key: string
  name: string
  x_m: string
  y_m: string
  length_m: string
  width_m: string
  capacity_t_per_m2: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_VESSEL: VesselFormState = {
  name: '', vessel_type: 'PLSV', description: '',
  deck_length_m: '', deck_width_m: '',
  crane_type: 'OMC',
  crane_pedestal_x: '0', crane_pedestal_y: '0', crane_pedestal_height_m: '',
  crane_boom_length_m: '', crane_jib_length_m: '',
  crane_slew_min_deg: '0', crane_slew_max_deg: '360',
}

function vesselToForm(v: Vessel): VesselFormState {
  return {
    name: v.name, vessel_type: v.vessel_type, description: v.description ?? '',
    deck_length_m: String(v.deck_length_m), deck_width_m: String(v.deck_width_m),
    crane_type: v.crane_type,
    crane_pedestal_x: String(v.crane_pedestal_x), crane_pedestal_y: String(v.crane_pedestal_y),
    crane_pedestal_height_m: String(v.crane_pedestal_height_m),
    crane_boom_length_m: String(v.crane_boom_length_m),
    crane_jib_length_m: v.crane_jib_length_m != null ? String(v.crane_jib_length_m) : '',
    crane_slew_min_deg: String(v.crane_slew_min_deg ?? 0),
    crane_slew_max_deg: String(v.crane_slew_max_deg ?? 360),
  }
}

function validateBarrierRows(rows: BarrierRow[], deckLength: number, deckWidth: number): string[] {
  return rows.flatMap((b, i) => {
    const label = b.name.trim() || `Row ${i + 1}`
    const errs: string[] = []
    if (!b.name.trim()) errs.push(`Barrier ${i + 1}: Name is required`)
    const x = parseFloat(b.x_m)
    if (isNaN(x) || x < 0 || x > deckLength) errs.push(`Barrier "${label}": X must be 0–${deckLength} m`)
    const y = parseFloat(b.y_m)
    if (isNaN(y) || y < 0 || y > deckWidth) errs.push(`Barrier "${label}": Y must be 0–${deckWidth} m`)
    if (isNaN(parseFloat(b.length_m)) || parseFloat(b.length_m) <= 0) errs.push(`Barrier "${label}": Length must be > 0`)
    if (isNaN(parseFloat(b.width_m)) || parseFloat(b.width_m) <= 0) errs.push(`Barrier "${label}": Width must be > 0`)
    return errs
  })
}

function validateZoneRows(rows: ZoneRow[], deckLength: number, deckWidth: number): string[] {
  return rows.flatMap((z, i) => {
    const label = z.name.trim() || `Row ${i + 1}`
    const errs: string[] = []
    if (!z.name.trim()) errs.push(`Zone ${i + 1}: Name is required`)
    const x = parseFloat(z.x_m)
    if (isNaN(x) || x < 0 || x > deckLength) errs.push(`Zone "${label}": X must be 0–${deckLength} m`)
    const y = parseFloat(z.y_m)
    if (isNaN(y) || y < 0 || y > deckWidth) errs.push(`Zone "${label}": Y must be 0–${deckWidth} m`)
    if (isNaN(parseFloat(z.length_m)) || parseFloat(z.length_m) <= 0) errs.push(`Zone "${label}": Length must be > 0`)
    if (isNaN(parseFloat(z.width_m)) || parseFloat(z.width_m) <= 0) errs.push(`Zone "${label}": Width must be > 0`)
    if (isNaN(parseFloat(z.capacity_t_per_m2)) || parseFloat(z.capacity_t_per_m2) <= 0)
      errs.push(`Zone "${label}": Capacity must be > 0`)
    return errs
  })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVesselEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === undefined

  const [values, setValues] = useState<VesselFormState>(DEFAULT_VESSEL)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [barriers, setBarriers] = useState<BarrierRow[]>([])
  const [zones, setZones] = useState<ZoneRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([loadVessel(id), loadVesselBarriers(id), loadDeckLoadZones(id)]).then(
      ([vessel, barrs, zns]) => {
        if (vessel.error) { setNotification({ msg: `Load failed: ${vessel.error}`, ok: false }); setLoading(false); return }
        if (vessel.data) setValues(vesselToForm(vessel.data))
        if (barrs.data) setBarriers(barrs.data.map((b) => ({
          _key: crypto.randomUUID(), name: b.name,
          x_m: String(b.x_m), y_m: String(b.y_m),
          length_m: String(b.length_m), width_m: String(b.width_m),
          height_m: String(b.height_m ?? 1),
        })))
        if (zns.data) setZones(zns.data.map((z) => ({
          _key: crypto.randomUUID(), name: z.name,
          x_m: String(z.x_m), y_m: String(z.y_m),
          length_m: String(z.length_m), width_m: String(z.width_m),
          capacity_t_per_m2: String(z.capacity_t_per_m2),
        })))
        setLoading(false)
      },
    )
  }, [id])

  const handleChange = useCallback((field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
  }, [])

  async function handleSave() {
    setSaving(true)
    setFieldErrors({})
    setNotification(null)

    const raw = {
      name: values.name.trim(), vessel_type: values.vessel_type as VesselType,
      description: values.description.trim() || null,
      deck_length_m: parseFloat(values.deck_length_m), deck_width_m: parseFloat(values.deck_width_m),
      deck_origin_x: 0, deck_origin_y: 0,
      crane_type: values.crane_type as CraneType,
      crane_pedestal_x: parseFloat(values.crane_pedestal_x),
      crane_pedestal_y: parseFloat(values.crane_pedestal_y),
      crane_pedestal_height_m: parseFloat(values.crane_pedestal_height_m),
      crane_boom_length_m: parseFloat(values.crane_boom_length_m),
      crane_jib_length_m: values.crane_jib_length_m ? parseFloat(values.crane_jib_length_m) : null,
      crane_slew_min_deg: parseFloat(values.crane_slew_min_deg),
      crane_slew_max_deg: parseFloat(values.crane_slew_max_deg),
    }

    const result = vesselSchema.safeParse(raw)
    if (!result.success) {
      const fe: Record<string, string> = {}
      result.error.errors.forEach((e) => { const f = e.path[0]?.toString(); if (f) fe[f] = e.message })
      setFieldErrors(fe)
      setNotification({ msg: 'Please fix the validation errors below.', ok: false })
      setSaving(false)
      return
    }

    const { deck_length_m, deck_width_m } = result.data
    const rowErrs = [...validateBarrierRows(barriers, deck_length_m, deck_width_m), ...validateZoneRows(zones, deck_length_m, deck_width_m)]
    if (rowErrs.length > 0) {
      setNotification({ msg: rowErrs.join(' · '), ok: false })
      setSaving(false)
      return
    }

    const validated = { ...result.data, description: result.data.description ?? null, crane_jib_length_m: result.data.crane_jib_length_m ?? null }
    const { data: saved, error: vesselErr } = await saveVessel(isNew ? validated : { ...validated, id })
    if (vesselErr || !saved) { setNotification({ msg: `Save failed: ${vesselErr ?? 'unknown'}`, ok: false }); setSaving(false); return }

    const vid = saved.id
    const { error: barrErr } = await saveVesselBarriers(vid, barriers.map((b) => ({
      name: b.name.trim(), x_m: parseFloat(b.x_m), y_m: parseFloat(b.y_m),
      length_m: parseFloat(b.length_m), width_m: parseFloat(b.width_m),
      height_m: parseFloat(b.height_m) || 1.0,
    })))
    if (barrErr) { setNotification({ msg: `Barriers save failed: ${barrErr}`, ok: false }); setSaving(false); return }

    const { error: zoneErr } = await saveDeckLoadZones(vid, zones.map((z) => ({
      name: z.name.trim(), x_m: parseFloat(z.x_m), y_m: parseFloat(z.y_m),
      length_m: parseFloat(z.length_m), width_m: parseFloat(z.width_m),
      capacity_t_per_m2: parseFloat(z.capacity_t_per_m2),
    })))
    if (zoneErr) { setNotification({ msg: `Load zones save failed: ${zoneErr}`, ok: false }); setSaving(false); return }

    if (isNew) {
      navigate(`/vessels/${vid}`)
    } else {
      setNotification({ msg: 'Vessel saved successfully.', ok: true })
      setTimeout(() => setNotification(null), 3000)
    }
    setSaving(false)
  }

  return {
    isNew, loading, saving, notification,
    values, fieldErrors, handleChange,
    barriers, setBarriers,
    zones, setZones,
    deckLength: parseFloat(values.deck_length_m) || 0,
    deckWidth: parseFloat(values.deck_width_m) || 0,
    handleSave,
  }
}
