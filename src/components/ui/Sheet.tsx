import type { ReactNode } from 'react'

type SheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function Sheet({ open, onClose, title, children }: SheetProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-zinc-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-zinc-700" />
        {title && <h2 className="mb-3 text-lg font-semibold text-zinc-100">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
