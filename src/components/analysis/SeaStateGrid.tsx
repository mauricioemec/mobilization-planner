import { TP_VALUES, HS_VALUES } from '../../lib/calculations/dnv/generateSeaStateGrid'
import type { ForceBreakdown } from '../../lib/calculations/dnv/seaStateFeasibility'

export type GridCell = {
  hs_m: number
  tp_s: number
  is_feasible: boolean
  utilization_pct: number
  force_breakdown?: ForceBreakdown
  daf?: number
}

type Props = {
  cells: GridCell[]
}

/** Maximum operable Hs for a given Tp: highest Hs row where is_feasible = true. */
function maxHsForTp(cells: GridCell[], tp: number): number {
  const feasible = cells.filter((c) => c.tp_s === tp && c.is_feasible)
  if (feasible.length === 0) return 0
  return Math.max(...feasible.map((c) => c.hs_m))
}

/** Utilization at the max operable Hs cell for tooltip detail. */
function utilAtMaxHs(cells: GridCell[], tp: number, maxHs: number): number {
  const cell = cells.find((c) => c.tp_s === tp && c.hs_m === maxHs)
  return cell?.utilization_pct ?? 0
}

function cellColor(maxHs: number): string {
  if (maxHs > 2.0) return 'bg-green-100 text-green-900 border-green-300'
  if (maxHs >= 1.5) return 'bg-yellow-100 text-yellow-900 border-yellow-300'
  if (maxHs > 0) return 'bg-red-100 text-red-900 border-red-300'
  return 'bg-gray-100 text-gray-400 border-gray-200'
}

export function SeaStateGrid({ cells }: Props) {
  if (cells.length === 0) {
    return (
      <div className="rounded border border-gray-200 px-4 py-8 text-center text-xs text-gray-400">
        Run analysis to see the operability table
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="text-[11px] border-collapse w-full">
          <thead>
            <tr>
              <th className="px-3 py-1.5 text-left text-gray-500 font-normal whitespace-nowrap w-28 border border-gray-200 bg-gray-50">
                Tp (s)
              </th>
              {TP_VALUES.map((tp) => (
                <th
                  key={tp}
                  className="px-2 py-1.5 text-center font-medium text-gray-600 border border-gray-200 bg-gray-50 w-14"
                >
                  {tp}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 text-gray-500 font-medium border border-gray-200 bg-gray-50 whitespace-nowrap">
                Max Hs (m)
              </td>
              {TP_VALUES.map((tp) => {
                const maxHs = maxHsForTp(cells, tp)
                const util = maxHs > 0 ? utilAtMaxHs(cells, tp, maxHs) : null
                const label = maxHs > 0 ? maxHs.toFixed(2) : '—'
                return (
                  <td
                    key={tp}
                    title={util != null ? `Tp = ${tp} s | Max Hs = ${maxHs.toFixed(2)} m | Util = ${util.toFixed(1)}%` : `Tp = ${tp} s | Not operable`}
                    className={`px-2 py-2 text-center font-semibold border cursor-default select-none ${cellColor(maxHs)}`}
                  >
                    {label}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-100 border border-green-300" />
          Hs &gt; 2.0 m — Good operability
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-yellow-100 border border-yellow-300" />
          1.5 – 2.0 m — Limited operability
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
          &lt; 1.5 m — Restricted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" />
          — Not operable
        </span>
      </div>

      {/* Hs reference context */}
      <p className="text-[10px] text-gray-400">
        Maximum significant wave height at which the lift is feasible across all periods at each Tp.
        Hover a cell for utilization detail.
      </p>
    </div>
  )
}

// Keep HS_VALUES exported for any downstream consumers
export { HS_VALUES }
