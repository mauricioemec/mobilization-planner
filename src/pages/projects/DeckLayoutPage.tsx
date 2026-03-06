import { useRef } from 'react'
import { useDeckLayout } from '../../hooks/useDeckLayout'
import { useProjectStore } from '../../stores/useProjectStore'
import { DeckCanvas, type DeckCanvasHandle } from '../../components/deck-layout/DeckCanvas'
import { EquipmentPanel } from '../../components/deck-layout/EquipmentPanel'

function ToolbarBtn({ onClick, label, active }: { onClick: () => void; label: string; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-3 py-1 text-xs font-medium transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
    >
      {label}
    </button>
  )
}

export default function DeckLayoutPage() {
  const canvasRef = useRef<DeckCanvasHandle>(null)
  const activeProject = useProjectStore((s) => s.activeProject)
  const {
    vessel, barriers, zones, placed, library, libById, validationMap,
    selectedId, setSelectedId, showGrid, setShowGrid, snap, setSnap,
    handleDrop, handleMove, handleRotate, handleRemove, isLoading,
  } = useDeckLayout()

  const snapshot = activeProject?.vessel_snapshot
  const craneCurve = snapshot?.crane_curve_points ?? []

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading deck…</div>
  }

  if (!vessel) {
    return <div className="flex h-full items-center justify-center text-sm text-gray-400">No vessel snapshot for this project.</div>
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Canvas area + right panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas column */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <DeckCanvas
            ref={canvasRef}
            vessel={vessel}
            barriers={barriers}
            zones={zones}
            craneCurve={craneCurve}
            placed={placed}
            libById={libById}
            validationMap={validationMap}
            selectedId={selectedId}
            showGrid={showGrid}
            onDrop={handleDrop}
            onMove={handleMove}
            onSelect={(id) => setSelectedId(id)}
          />

          {/* Toolbar */}
          <div className="flex shrink-0 items-center gap-2 border-t border-gray-200 bg-white px-4 py-2">
            <ToolbarBtn label="Zoom +" onClick={() => canvasRef.current?.zoomIn()} />
            <ToolbarBtn label="Zoom −" onClick={() => canvasRef.current?.zoomOut()} />
            <ToolbarBtn label="Fit" onClick={() => canvasRef.current?.fit()} />
            <span className="w-px h-4 bg-gray-200 mx-1" />
            <ToolbarBtn label={showGrid ? 'Grid On' : 'Grid Off'} onClick={() => setShowGrid(!showGrid)} active={showGrid} />
            <ToolbarBtn label={snap ? 'Snap On' : 'Snap Off'} onClick={() => setSnap(!snap)} active={snap} />
            <span className="ml-auto text-xs text-gray-400">
              {placed.length} item{placed.length !== 1 ? 's' : ''} on deck
              {snap && ' · snap 0.5 m'}
            </span>
          </div>
        </div>

        {/* Right panel — 280px */}
        <aside className="w-[280px] shrink-0 overflow-hidden border-l border-gray-200 bg-white">
          <EquipmentPanel
            library={library}
            placed={placed}
            libById={libById}
            validationMap={validationMap}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onRemove={handleRemove}
            onRotate={handleRotate}
          />
        </aside>
      </div>
    </div>
  )
}
