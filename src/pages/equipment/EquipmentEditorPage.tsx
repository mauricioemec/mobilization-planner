import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { EquipmentForm } from '../../components/equipment/EquipmentForm'
import { Equipment3DPreview } from '../../components/equipment/Equipment3DPreview'
import { CalculatedProperties } from '../../components/equipment/CalculatedProperties'
import { useEquipmentEditor } from '../../hooks/useEquipmentEditor'
import type { GeometryType } from '../../types/database'

export default function EquipmentEditorPage() {
  const navigate = useNavigate()

  const {
    isNew, loading, saving, notification,
    values, fieldErrors, handleChange, handleSave,
  } = useEquipmentEditor()

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-gray-500">Loading…</div>
  }

  const title = isNew ? 'New Equipment' : (values.name || 'Equipment Editor')

  const length = parseFloat(values.length_m) || 0
  const width = parseFloat(values.width_m) || 0
  const height = parseFloat(values.height_m) || 0
  const weight = parseFloat(values.dry_weight_t) || 0
  const geometryType = (values.geometry_type || 'box') as GeometryType

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/equipment')}>
            ← Back to Equipment
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
        {/* Left panel — 40% — 3D preview */}
        <div className="w-2/5 shrink-0 border-r border-gray-200">
          <Equipment3DPreview
            length={length}
            width={width}
            height={height}
            geometryType={geometryType}
          />
        </div>

        {/* Right panel — 60% — form + calculated properties */}
        <div className="flex flex-1 flex-col overflow-auto">
          <EquipmentForm values={values} errors={fieldErrors} onChange={handleChange} />
          <div className="px-4 pb-4">
            <CalculatedProperties
              length={length}
              width={width}
              height={height}
              weight={weight}
              geometryType={geometryType}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
