import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import QuickActionButton from '@/components/quick-actions/QuickActionButton'

export default function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <main className="flex-1 pb-28 pt-[max(1.5rem,calc(env(safe-area-inset-top)+0.75rem))]">
        <Outlet />
      </main>
      <QuickActionButton />
      <BottomNav />
    </div>
  )
}
