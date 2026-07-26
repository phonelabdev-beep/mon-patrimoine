import { useState } from 'react'
import { Plus } from 'lucide-react'
import QuickActionMenu from './QuickActionMenu'

export default function QuickActionButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Nouvelle action"
        className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 active:scale-95"
        style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }}
      >
        <Plus size={28} />
      </button>
      <QuickActionMenu open={open} onClose={() => setOpen(false)} />
    </>
  )
}
