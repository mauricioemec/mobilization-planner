import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'
import { DeckTab } from '../../components/vessels/DeckTab'
import { CraneTab } from '../../components/vessels/CraneTab'
import { BarriersTab } from '../../components/vessels/BarriersTab'
import { DeckLoadZonesTab } from '../../components/vessels/DeckLoadZonesTab'
import { CraneCurveTab } from '../../components/vessels/CraneCurveTab'
import { DeckPreviewCanvas } from '../../components/vessels/DeckPreviewCanvas'
import { useVesselEditor } from '../../hooks/useVesselEditor'

export default function VesselEditorPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('deck')

  const {
    isNew, loading, saving, notification,
    values, fieldErrors, handleChange,
    barriers, setBarriers,
    zones, setZones,
    cranePoints, setCranePoints,
    deckLength, deckWidth,
    handleSave,
  } = useVesselEditor()

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-gray-500">Loading…</div>
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
        {/* Left panel — 40% — 2D deck preview */}
        <div className="w-2/5 shrink-0 border-r border-gray-200">
          <DeckPreviewCanvas
            values={values}
            barriers={barriers}
            zones={zones}
            cranePoints={cranePoints}
          />
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
                <DeckTab values={values} errors={fieldErrors} onChange={handleChange} />
              </TabsContent>
              <TabsContent value="barriers">
                <BarriersTab
                  rows={barriers}
                  deckLength={deckLength}
                  deckWidth={deckWidth}
                  onChange={setBarriers}
                />
              </TabsContent>
              <TabsContent value="load-zones">
                <DeckLoadZonesTab
                  rows={zones}
                  deckLength={deckLength}
                  deckWidth={deckWidth}
                  onChange={setZones}
                />
              </TabsContent>
              <TabsContent value="crane">
                <CraneTab values={values} errors={fieldErrors} onChange={handleChange} />
              </TabsContent>
              <TabsContent value="crane-curve">
                <CraneCurveTab rows={cranePoints} onChange={setCranePoints} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
