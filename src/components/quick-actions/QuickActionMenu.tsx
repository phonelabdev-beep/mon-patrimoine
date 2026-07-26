import { useNavigate } from 'react-router-dom'
import { Smartphone, Package, Wrench, ShoppingBag, Receipt, Hammer } from 'lucide-react'
import Sheet from '@/components/ui/Sheet'

const ACTIONS = [
  { to: '/nouveau/achat-telephone', label: 'Achat téléphone', icon: Smartphone },
  { to: '/nouveau/achat-pieces', label: 'Achat pièce(s)', icon: Package },
  { to: '/nouveau/utilisation-piece', label: 'Utilisation pièce', icon: Hammer },
  { to: '/nouveau/reparation', label: 'Réparation client', icon: Wrench },
  { to: '/nouveau/vente-telephone', label: 'Vente téléphone', icon: ShoppingBag },
  { to: '/nouveau/depense', label: 'Dépense', icon: Receipt },
]

export default function QuickActionMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <Sheet open={open} onClose={onClose} title="Nouvelle action">
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(({ to, label, icon: Icon }) => (
          <button
            key={to}
            type="button"
            onClick={() => {
              onClose()
              navigate(to)
            }}
            className="flex min-h-[44px] flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-800/50 p-4 text-sm text-zinc-100 active:bg-zinc-800"
          >
            <Icon size={24} />
            {label}
          </button>
        ))}
      </div>
    </Sheet>
  )
}
