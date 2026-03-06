import { useParams } from 'react-router-dom'

export default function VesselEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === undefined

  return (
    <div className="overflow-auto p-8">
      <h1 className="text-2xl font-semibold text-gray-900">
        {isNew ? 'New Vessel' : 'Vessel Editor'}
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        {isNew ? 'Placeholder — vessel creation form goes here.' : `Placeholder — editing vessel ${id}.`}
      </p>
    </div>
  )
}
