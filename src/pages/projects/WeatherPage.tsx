import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectStore } from '../../stores/useProjectStore'
import { useDeckLayoutStore } from '../../stores/useDeckLayoutStore'
import { useEquipmentStore } from '../../stores/useEquipmentStore'
import { useWeatherStore } from '../../stores/useWeatherStore'
import { useAnalysisStore } from '../../stores/useAnalysisStore'
import { Button } from '../../components/ui/button'
import { ScatterTable } from '../../components/weather/ScatterTable'
import { ScatterPasteDialog } from '../../components/weather/ScatterPasteDialog'
import { OperabilityResultsTable, type OperabilityItem } from '../../components/weather/OperabilityResultsTable'
import { OverlayView } from '../../components/weather/OverlayView'
import { calculateOperability } from '../../lib/calculations/weather/operabilityAnalysis'
import {
  emptyMatrix,
  entriesToMatrix,
  matrixToEntries,
  totalOccurrence,
  type ScatterMatrix,
} from '../../components/weather/scatterMatrix'
import type { EquipmentLibrary } from '../../types/database'

export default function WeatherPage() {
  const { id: projectId } = useParams<{ id: string }>()
  useProjectStore((s) => s.activeProject) // keep active project in context
  const deckStore = useDeckLayoutStore()
  const equipStore = useEquipmentStore()
  const weatherStore = useWeatherStore()
  const analysisStore = useAnalysisStore()

  const [matrix, setMatrix] = useState<ScatterMatrix>(emptyMatrix())
  const [pasteOpen, setPasteOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [overlayPeId, setOverlayPeId] = useState('')

  // Equipment items that have been analyzed (have a splash zone result)
  const analyzedItems = useMemo(
    () => deckStore.items.filter((pe) => analysisStore.results[pe.id] != null),
    [deckStore.items, analysisStore.results],
  )

  const libById = useMemo<Record<string, EquipmentLibrary>>(() => {
    const m: Record<string, EquipmentLibrary> = {}
    equipStore.items.forEach((e) => { m[e.id] = e })
    return m
  }, [equipStore.items])

  // Load all data on mount
  useEffect(() => {
    if (!projectId) return
    void weatherStore.loadScatterDiagram(projectId)
    void deckStore.loadProjectEquipment(projectId)
    void equipStore.loadEquipment()
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load analysis results for each equipment item (once deck items are known)
  useEffect(() => {
    for (const pe of deckStore.items) {
      if (!analysisStore.results[pe.id]) void analysisStore.loadResults(pe.id)
    }
  }, [deckStore.items]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select first overlay item
  useEffect(() => {
    if (!overlayPeId && analyzedItems.length > 0) setOverlayPeId(analyzedItems[0].id)
  }, [analyzedItems, overlayPeId])

  // Populate matrix from Supabase scatter entries
  useEffect(() => {
    setMatrix(entriesToMatrix(weatherStore.scatterEntries))
  }, [weatherStore.scatterEntries])

  // Compute operability for all analyzed equipment (pure, no side effects)
  const operabilityItems = useMemo<OperabilityItem[]>(() => {
    return analyzedItems.map((pe) => {
      const eq = libById[pe.equipment_id]
      const result = analysisStore.results[pe.id]
      const limits = result ? (analysisStore.seaStateLimits[result.id] ?? []) : []
      const entries = matrixToEntries(matrix)
      const operability = calculateOperability(entries, limits)
      return {
        id: pe.id,
        name: pe.label ?? eq?.name ?? pe.id,
        max_hs_m: result?.max_hs_m ?? 0,
        operability_pct: operability,
      }
    })
  }, [analyzedItems, analysisStore.results, analysisStore.seaStateLimits, matrix, libById])

  async function handleSave() {
    if (!projectId) return
    const entries = matrixToEntries(matrix)
    await weatherStore.saveScatterDiagram(projectId, entries)

    // Persist weather window results for all analyzed equipment
    for (const pe of analyzedItems) {
      const result = analysisStore.results[pe.id]
      const limits = result ? (analysisStore.seaStateLimits[result.id] ?? []) : []
      if (limits.length > 0) {
        await weatherStore.calculateOperability(pe.id, limits, result?.max_hs_m ?? 0)
      }
    }
    setSaved(true)
  }

  // Overlay: get limits for selected equipment
  const overlayResult = overlayPeId ? analysisStore.results[overlayPeId] : null
  const overlayLimits = overlayResult ? (analysisStore.seaStateLimits[overlayResult.id] ?? []) : []
  const overlayLabel = overlayPeId
    ? (() => { const pe = deckStore.items.find((p) => p.id === overlayPeId); return pe?.label ?? libById[pe?.equipment_id ?? '']?.name ?? '' })()
    : ''

  const total = totalOccurrence(matrix)
  const totalWarn = total > 0 && (total < 98 || total > 102)

  return (
    <div className="overflow-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Weather Window Analysis</h1>

      {/* ── Scatter Diagram Input ──────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Scatter Diagram Input</h2>
        <ScatterTable matrix={matrix} onChange={(m) => { setMatrix(m); setSaved(false) }} />
        {totalWarn && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
            Total occurrence is {total.toFixed(1)} % — should be ~100 % (tolerance ±2 %)
          </p>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setPasteOpen(true)}>
            Paste from Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setMatrix(emptyMatrix()); setSaved(false) }}>
            Clear
          </Button>
          <Button size="sm" onClick={handleSave} disabled={weatherStore.isSaving}>
            {weatherStore.isSaving ? 'Saving…' : 'Save'}
          </Button>
          {saved && <span className="self-center text-xs text-green-600">Saved</span>}
        </div>
        {weatherStore.error && (
          <p className="text-xs text-red-600">{weatherStore.error}</p>
        )}
      </section>

      {/* ── Operability Results ───────────────────────────────── */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">Operability Results</h2>
        <OperabilityResultsTable items={operabilityItems} />
      </section>

      {/* ── Overlay View ─────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Scatter Diagram Overlay</h2>
        {analyzedItems.length > 0 ? (
          <>
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Equipment</label>
              <select
                value={overlayPeId}
                onChange={(e) => setOverlayPeId(e.target.value)}
                className="rounded border border-gray-300 bg-white px-3 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {analyzedItems.map((pe) => {
                  const eq = libById[pe.equipment_id]
                  return (
                    <option key={pe.id} value={pe.id}>
                      {pe.label ?? eq?.name ?? pe.id}
                    </option>
                  )
                })}
              </select>
            </div>
            <OverlayView matrix={matrix} limits={overlayLimits} equipmentLabel={overlayLabel} />
          </>
        ) : (
          <div className="rounded border border-gray-200 px-4 py-6 text-center text-xs text-gray-400">
            Run DNV analysis for at least one equipment item to enable the overlay view
          </div>
        )}
      </section>

      <ScatterPasteDialog
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        onPaste={(m) => { setMatrix(m); setSaved(false) }}
      />
    </div>
  )
}
