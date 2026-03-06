import { useEffect } from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useProjectStore } from '../../stores/useProjectStore'
import { Skeleton } from '../../components/ui/skeleton'

type SidebarLink = {
  to: string
  label: string
  /** Use end=true only for the Overview index route so it isn't always active */
  end?: boolean
}

const SIDEBAR_LINKS: SidebarLink[] = [
  { to: '.', label: 'Overview', end: true },
  { to: 'deck', label: 'Deck' },
  { to: 'rao', label: 'RAO' },
  { to: 'analysis', label: 'Analysis' },
  { to: 'weather', label: 'Weather' },
  { to: '3d', label: '3D' },
  { to: 'report', label: 'Report' },
]

/**
 * Project workspace shell.
 * Loads the active project from Supabase on mount and renders a 200px sidebar
 * (project meta + sub-page nav) alongside the active sub-page via Outlet.
 */
export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>()
  const { activeProject, loadProject, clearActiveProject } = useProjectStore()

  useEffect(() => {
    if (id) void loadProject(id)
    return () => clearActiveProject()
  }, [id, loadProject, clearActiveProject])

  const isLoaded = activeProject !== null && activeProject.id === id
  const vesselName = isLoaded ? (activeProject.vessel_snapshot?.vessel.name ?? '—') : null

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="flex w-[200px] flex-shrink-0 flex-col overflow-y-auto border-r border-slate-700 bg-slate-800">
        {/* Project summary */}
        <div className="border-b border-slate-700 px-4 py-4">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-slate-400">
            Project
          </p>
          {isLoaded ? (
            <>
              <p className="mt-1 truncate text-sm font-semibold text-white" title={activeProject.name}>
                {activeProject.name}
              </p>
              {vesselName && (
                <p className="mt-0.5 truncate text-xs text-slate-400" title={vesselName}>
                  {vesselName}
                </p>
              )}
              <span
                className={[
                  'mt-2 inline-block rounded px-1.5 py-0.5 text-xs font-medium',
                  activeProject.status === 'complete'
                    ? 'bg-green-700 text-green-100'
                    : activeProject.status === 'analyzed'
                      ? 'bg-amber-700 text-amber-100'
                      : 'bg-slate-600 text-slate-200',
                ].join(' ')}
              >
                {activeProject.status}
              </span>
            </>
          ) : (
            <>
              <Skeleton className="mt-1 h-4 w-32 bg-slate-600" />
              <Skeleton className="mt-1.5 h-3 w-24 bg-slate-600" />
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 px-2 py-3">
          {SIDEBAR_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              relative="path"
              className={({ isActive }) =>
                [
                  'rounded px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Content area ── */}
      <div className="flex flex-1 flex-col overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
