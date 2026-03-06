import { useParams } from 'react-router-dom'

export default function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="overflow-auto p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Project Overview</h1>
      <p className="mt-2 text-sm text-gray-500">Placeholder — project summary for {id}.</p>
    </div>
  )
}
