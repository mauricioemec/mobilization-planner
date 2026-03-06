import { useParams } from 'react-router-dom'

export default function EquipmentEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === undefined

  return (
    <div className="overflow-auto p-8">
      <h1 className="text-2xl font-semibold text-gray-900">
        {isNew ? 'New Equipment' : 'Equipment Editor'}
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        {isNew ? 'Placeholder — equipment creation form goes here.' : `Placeholder — editing equipment ${id}.`}
      </p>
    </div>
  )
}
