import { HashRouter } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import AppRoutes from './routes'

function App() {
  const hydrated = useAppStore((s) => s.hydrated)

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Chargement…
      </div>
    )
  }

  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}

export default App
