import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RootLayout } from './components/layout/RootLayout'

// Vessel pages
import VesselListPage from './pages/vessels/VesselListPage'
import VesselEditorPage from './pages/vessels/VesselEditorPage'

// Equipment pages
import EquipmentListPage from './pages/equipment/EquipmentListPage'
import EquipmentEditorPage from './pages/equipment/EquipmentEditorPage'

// Project pages
import ProjectListPage from './pages/projects/ProjectListPage'
import NewProjectPage from './pages/projects/NewProjectPage'
import ProjectWorkspace from './pages/projects/ProjectWorkspace'
import ProjectOverviewPage from './pages/projects/ProjectOverviewPage'
import DeckLayoutPage from './pages/projects/DeckLayoutPage'
import RaoInputPage from './pages/projects/RaoInputPage'
import AnalysisPage from './pages/projects/AnalysisPage'
import WeatherPage from './pages/projects/WeatherPage'
import Viewer3DPage from './pages/projects/Viewer3DPage'
import ReportPage from './pages/projects/ReportPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<RootLayout />}>
          {/* Root redirect */}
          <Route index element={<Navigate to="/projects" replace />} />

          {/* Vessel Library */}
          <Route path="vessels" element={<VesselListPage />} />
          <Route path="vessels/new" element={<VesselEditorPage />} />
          <Route path="vessels/:id" element={<VesselEditorPage />} />

          {/* Equipment Library */}
          <Route path="equipment" element={<EquipmentListPage />} />
          <Route path="equipment/new" element={<EquipmentEditorPage />} />
          <Route path="equipment/:id" element={<EquipmentEditorPage />} />

          {/* Projects */}
          <Route path="projects" element={<ProjectListPage />} />
          <Route path="projects/new" element={<NewProjectPage />} />

          {/* Project workspace — nested routes rendered inside sidebar shell */}
          <Route path="projects/:id" element={<ProjectWorkspace />}>
            <Route index element={<ProjectOverviewPage />} />
            <Route path="deck" element={<DeckLayoutPage />} />
            <Route path="rao" element={<RaoInputPage />} />
            <Route path="analysis" element={<AnalysisPage />} />
            <Route path="weather" element={<WeatherPage />} />
            <Route path="3d" element={<Viewer3DPage />} />
            <Route path="report" element={<ReportPage />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  )
}
