import { forwardRef, useImperativeHandle, useMemo } from 'react'
import { Stage, Layer, Rect, Ellipse, Circle, Line, Arrow, Text, Shape, Group } from 'react-konva'
import { useDeckTransform } from '../../hooks/useDeckTransform'
import type { VesselBarrier, DeckLoadZone, CraneCurvePoint, Vessel, ProjectEquipment, EquipmentLibrary } from '../../types/database'
import type { ValidationResult } from '../../lib/calculations/deckValidation'

export type DeckCanvasHandle = { zoomIn: () => void; zoomOut: () => void; fit: () => void }

type Props = {
  vessel: Vessel | null
  barriers: VesselBarrier[]; zones: DeckLoadZone[]
  craneCurve: CraneCurvePoint[]; placed: ProjectEquipment[]
  libById: Record<string, EquipmentLibrary>; validationMap: Record<string, ValidationResult>
  selectedId: string | null; showGrid: boolean
  onDrop: (equipId: string, wx: number, wy: number) => void
  onMove: (id: string, wx: number, wy: number) => void
  onSelect: (id: string | null) => void
}

export const DeckCanvas = forwardRef<DeckCanvasHandle, Props>(function DeckCanvas(props, ref) {
  const { vessel, barriers, zones, craneCurve, placed, libById, validationMap, selectedId, showGrid, onDrop, onMove, onSelect } = props
  const deckL = vessel?.deck_length_m ?? 0
  const deckW = vessel?.deck_width_m ?? 0
  const { containerRef, stageRef, size, tf, handleWheel } = useDeckTransform(deckL, deckW)

  useImperativeHandle(ref, () => ({
    zoomIn() {
      const stage = stageRef.current; if (!stage) return
      const s = stage.scaleX(); const cx = size.w / 2; const cy = size.h / 2
      const ns = Math.min(20, s * 1.25)
      const ox = (stage.x() - cx) * (ns / s) + cx; const oy = (stage.y() - cy) * (ns / s) + cy
      stage.scale({ x: ns, y: ns }); stage.position({ x: ox, y: oy })
    },
    zoomOut() {
      const stage = stageRef.current; if (!stage) return
      const s = stage.scaleX(); const cx = size.w / 2; const cy = size.h / 2
      const ns = Math.max(0.1, s / 1.25)
      const ox = (stage.x() - cx) * (ns / s) + cx; const oy = (stage.y() - cy) * (ns / s) + cy
      stage.scale({ x: ns, y: ns }); stage.position({ x: ox, y: oy })
    },
    fit() { const stage = stageRef.current; if (!stage) return; stage.scale({ x: 1, y: 1 }); stage.position({ x: 0, y: 0 }) },
  }))

  const { ox, oy, bs } = tf
  const wx = (x: number) => ox + x * bs
  const wy = (y: number) => oy + (deckW - y) * bs
  const fz = Math.max(7, Math.min(11, bs * 0.9))

  const gridLines = useMemo(() => {
    if (!showGrid || deckL <= 0) return []
    const lines: number[][] = []
    for (let x = 0; x <= deckL; x += 5) lines.push([wx(x), wy(0), wx(x), wy(deckW)])
    for (let y = 0; y <= deckW; y += 5) lines.push([wx(0), wy(y), wx(deckL), wy(y)])
    return lines
  }, [showGrid, deckL, deckW, tf]) // eslint-disable-line react-hooks/exhaustive-deps

  const maxR = useMemo(() => {
    const rs = craneCurve.map((p) => p.radius_m).filter((r) => r > 0)
    return rs.length ? Math.max(...rs) : 0
  }, [craneCurve])

  const pX = vessel?.crane_pedestal_x ?? 0
  const pY = vessel?.crane_pedestal_y ?? 0
  const sMin = vessel?.crane_slew_min_deg ?? 0
  const sMax = vessel?.crane_slew_max_deg ?? 360

  function handleCanvasDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const equipId = e.dataTransfer.getData('text/plain')
    if (!equipId) return
    const stage = stageRef.current; if (!stage) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const px = e.clientX - rect.left; const py = e.clientY - rect.top
    const sx = (px - stage.x()) / stage.scaleX()
    const sy = (py - stage.y()) / stage.scaleY()
    onDrop(equipId, (sx - ox) / bs, deckW - (sy - oy) / bs)
  }

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden bg-gray-50" onDragOver={(e) => e.preventDefault()} onDrop={handleCanvasDrop}>
      <Stage ref={stageRef} width={size.w} height={size.h} draggable onWheel={handleWheel}
        onClick={(e) => { if (e.target === e.target.getStage()) onSelect(null) }}>
        <Layer>
          {/* Grid */}
          {gridLines.map((pts, i) => <Line key={i} points={pts} stroke="#e5e7eb" strokeWidth={0.5} listening={false} />)}

          {/* Deck */}
          {deckL > 0 && <Rect x={wx(0)} y={wy(deckW)} width={deckL * bs} height={deckW * bs} fill="#d1d5db" stroke="#374151" strokeWidth={2} listening={false} />}

          {/* Load zones */}
          {zones.map((z) => <Group key={z.id} listening={false}>
            <Rect x={wx(z.x_m)} y={wy(z.y_m + z.width_m)} width={z.length_m * bs} height={z.width_m * bs} fill="rgba(59,130,246,0.18)" stroke="#3b82f6" strokeWidth={1} />
            <Text x={wx(z.x_m) + 3} y={wy(z.y_m + z.width_m) + 3} text={`${z.capacity_t_per_m2} t/m²`} fontSize={fz} fill="#1d4ed8" />
          </Group>)}

          {/* Barriers */}
          {barriers.map((b) => <Group key={b.id} listening={false}>
            <Rect x={wx(b.x_m)} y={wy(b.y_m + b.width_m)} width={b.length_m * bs} height={b.width_m * bs} fill="rgba(239,68,68,0.3)" stroke="#dc2626" strokeWidth={1} />
            <Text x={wx(b.x_m) + 3} y={wy(b.y_m + b.width_m) + 3} text={b.name} fontSize={fz} fill="#991b1b" />
          </Group>)}

          {/* Placed equipment */}
          {placed.map((pe) => {
            const eq = libById[pe.equipment_id]; if (!eq) return null
            const lPx = eq.length_m * bs; const wPx = eq.width_m * bs
            const cx = wx(pe.deck_pos_x); const cy = wy(pe.deck_pos_y)
            const vr = validationMap[pe.id]
            const bad = vr?.ok === false
            const sel = pe.id === selectedId
            const fill = bad ? 'rgba(239,68,68,0.55)' : 'rgba(34,197,94,0.55)'
            const stroke = sel ? '#2563eb' : bad ? '#dc2626' : '#16a34a'
            const sw = sel ? 2.5 : 1.5
            return (
              <Group key={pe.id} x={cx} y={cy} rotation={pe.deck_rotation_deg} draggable
                onClick={() => onSelect(pe.id)}
                onDragEnd={(e) => { onMove(pe.id, (e.target.x() - ox) / bs, deckW - (e.target.y() - oy) / bs) }}>
                {eq.geometry_type === 'cylinder'
                  ? <Ellipse radiusX={lPx / 2} radiusY={wPx / 2} fill={fill} stroke={stroke} strokeWidth={sw} />
                  : <Rect x={-lPx / 2} y={-wPx / 2} width={lPx} height={wPx} fill={fill} stroke={stroke} strokeWidth={sw} />}
                <Text text={pe.label ?? eq.name} fontSize={Math.max(6, Math.min(10, bs * 0.75))} fill="#1f2937" x={-lPx / 2 + 2} y={-wPx / 2 + 2} />
                {bad && <Text text="⚠" fontSize={12} fill="#dc2626" x={-6} y={-6} />}
              </Group>
            )
          })}

          {/* Crane */}
          {deckL > 0 && <>
            {maxR > 0 && <Shape x={wx(pX)} y={wy(pY)} stroke="#111827" strokeWidth={1.5} dash={[6, 4]} listening={false}
              sceneFunc={(ctx, shape) => {
                const r = maxR * bs; ctx.beginPath()
                if (sMax - sMin >= 360) ctx.arc(0, 0, r, 0, 2 * Math.PI, false)
                else ctx.arc(0, 0, r, -(sMin * Math.PI / 180), -(sMax * Math.PI / 180), true)
                ctx.strokeShape(shape)
              }} />}
            <Circle x={wx(pX)} y={wy(pY)} radius={6} fill="#111827" listening={false} />
            {/* Axes */}
            <Arrow points={[wx(0), wy(0), wx(Math.min(10, deckL * 0.15)), wy(0)]} fill="#dc2626" stroke="#dc2626" strokeWidth={1.5} pointerLength={6} pointerWidth={5} listening={false} />
            <Text x={wx(Math.min(10, deckL * 0.15)) + 4} y={wy(0) - 7} text="X" fontSize={9} fill="#dc2626" listening={false} />
            <Arrow points={[wx(0), wy(0), wx(0), wy(Math.min(8, deckW * 0.2))]} fill="#2563eb" stroke="#2563eb" strokeWidth={1.5} pointerLength={6} pointerWidth={5} listening={false} />
            <Text x={wx(0) + 4} y={wy(Math.min(8, deckW * 0.2)) - 12} text="Y" fontSize={9} fill="#2563eb" listening={false} />
          </>}
        </Layer>
      </Stage>
    </div>
  )
})
