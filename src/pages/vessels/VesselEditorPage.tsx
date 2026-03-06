import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'
import { DeckTab } from '../../components/vessels/DeckTab'
import { CraneTab } from '../../components/vessels/CraneTab'
import { loadVessel, saveVessel } from '../../lib/supabase/vesselService'
import { vesselSchema } from '../../validation/schemas'
import type { Vessel, VesselType, CraneType } from '../../types/database'

type VesselFormState = {
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

const DEFAULT_STATE: VesselFormState = {
  name: '',
  vessel_type: 'PLSV',
  description: '',
  deck_length_m: '',
  deck_width_m: '',
  crane_type: 'OMC',
  crane_pedestal_x: '0',
  crane_pedestal_y: '0',
  crane_pedestal_height_m: '',
  crane_boom_length_m: '',
  crane_jib_length_m: '',
  crane_slew_min_deg: '0',
  crane_slew_max_deg: '360',
}

function vesselToFormState(v: Vessel): VesselFormState {
  return {
    name: v.name,
    vessel_type: v.vessel_type,
    description: v.description ?? '',
    deck_length_m: String(v.deck_length_m),
    deck_width_m: String(v.deck_width_m),
    crane_type: v.crane_type,
    crane_pedestal_x: String(v.crane_pedestal_x),
    crane_pedestal_y: String(v.crane_pedestal_y),
    crane_pedestal_height_m: String(v.crane_pedestal_height_m),
    crane_boom_length_m: String(v.crane_boom_length_m),
    crane_jib_length_m: v.crane_jib_length_m != null ? String(v.crane_jib_length_m) : '',
    crane_slew_min_deg: String(v.crane_slew_min_deg ?? 0),
    crane_slew_max_deg: String(v.crane_slew_max_deg ?? 360),
  }
}

export default function VesselEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === undefined

  const [values, setValues] = useState<VesselFormState>(DEFAULT_STATE)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState('deck')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    loadVessel(id).then(({ data, error }) => {
      if (error) setNotification({ msg: `Failed to load vessel: ${error}`, ok: false })
      else if (data) setValues(vesselToFormState(data))
      setLoading(false)
    })
  }, [id])

  const handleChange = useCallback((field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    setErrors({})
    setNotification(null)

    const raw = {
      name: values.name.trim(),
      vessel_type: values.vessel_type as VesselType,
      description: values.description.trim() || null,
      deck_length_m: parseFloat(values.deck_length_m),
      deck_width_m: parseFloat(values.deck_width_m),
      deck_origin_x: 0,
      deck_origin_y: 0,
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
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((e) => {
        const field = e.path[0]?.toString()
        if (field) fieldErrors[field] = e.message
      })
      setErrors(fieldErrors)
      setNotification({ msg: 'Please fix the validation errors below.', ok: false })
      setSaving(false)
      return
    }

    const validated = {
      ...result.data,
      description: result.data.description ?? null,
      crane_jib_length_m: result.data.crane_jib_length_m ?? null,
    }
    const payload = isNew ? validated : { ...validated, id }
    const { data: saved, error } = await saveVessel(payload)

    if (error || !saved) {
      setNotification({ msg: `Save failed: ${error ?? 'unknown error'}`, ok: false })
      setSaving(false)
      return
    }

    if (isNew) {
      navigate(`/vessels/${saved.id}`)
    } else {
      setNotification({ msg: 'Vessel saved successfully.', ok: true })
      setTimeout(() => setNotification(null), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-500">Loading…</div>
  }

  const title = isNew ? 'New Vessel' : (values.name || 'Vessel Editor')

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/vessels')}>
            ← Back to Vessels
          </Button>
          <span className="text-gray-300">|</span>
          <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`shrink-0 px-6 py-2 text-sm font-medium ${
            notification.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {notification.msg}
        </div>
      )}

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — 40% — 2D preview placeholder */}
        <div className="flex w-2/5 shrink-0 items-center justify-center border-r border-gray-200 bg-gray-50">
          <div className="text-center text-sm text-gray-400">
            <div className="mb-1 text-3xl">🗺</div>
            <p className="font-medium">2D Deck Preview</p>
            <p className="text-xs">Coming in next module</p>
          </div>
        </div>

        {/* Right panel — 60% — tabbed form */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
            <TabsList>
              <TabsTrigger value="deck">Deck</TabsTrigger>
              <TabsTrigger value="barriers">Barriers</TabsTrigger>
              <TabsTrigger value="load-zones">Deck Load Zones</TabsTrigger>
              <TabsTrigger value="crane">Crane</TabsTrigger>
              <TabsTrigger value="crane-curve">Crane Curve</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              <TabsContent value="deck">
                <DeckTab values={values} errors={errors} onChange={handleChange} />
              </TabsContent>
              <TabsContent value="barriers">
                <div className="p-6 text-sm text-gray-400">Barriers editor — coming soon.</div>
              </TabsContent>
              <TabsContent value="load-zones">
                <div className="p-6 text-sm text-gray-400">Deck Load Zones editor — coming soon.</div>
              </TabsContent>
              <TabsContent value="crane">
                <CraneTab values={values} errors={errors} onChange={handleChange} />
              </TabsContent>
              <TabsContent value="crane-curve">
                <div className="p-6 text-sm text-gray-400">Crane Curve editor — coming soon.</div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
