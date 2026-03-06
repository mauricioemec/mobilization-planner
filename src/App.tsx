import { HashRouter, Route, Routes } from 'react-router-dom'

function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <h1 className="text-4xl font-bold text-white">SubLift</h1>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </HashRouter>
  )
}
