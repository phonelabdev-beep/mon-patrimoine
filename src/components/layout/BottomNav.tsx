import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Smartphone, Cpu, Wrench, MoreHorizontal } from 'lucide-react'
import Sheet from '@/components/ui/Sheet'

const TABS = [
  { to: '/', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/telephones', label: 'Téléphones', icon: Smartphone, end: false },
  { to: '/pieces', label: 'Pièces', icon: Cpu, end: false },
  { to: '/reparations', label: 'Réparations', icon: Wrench, end: false },
]

const PLUS_LINKS = [
  { to: '/tresorerie', label: 'Trésorerie' },
  { to: '/depenses', label: 'Dépenses' },
  { to: '/bilan', label: 'Bilan' },
  { to: '/journal', label: 'Journal' },
  { to: '/reglages', label: 'Réglages' },
]

export default function BottomNav() {
  const [plusOpen, setPlusOpen] = useState(false)

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-1">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 py-2 text-xs ${
                  isActive ? 'text-indigo-400' : 'text-zinc-400'
                }`
              }
            >
              <Icon size={22} />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setPlusOpen(true)}
            className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 py-2 text-xs text-zinc-400"
          >
            <MoreHorizontal size={22} />
            Plus
          </button>
        </div>
      </nav>

      <Sheet open={plusOpen} onClose={() => setPlusOpen(false)} title="Plus">
        <div className="flex flex-col divide-y divide-zinc-800">
          {PLUS_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setPlusOpen(false)}
              className="min-h-[44px] py-3 text-base text-zinc-100"
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </Sheet>
    </>
  )
}
