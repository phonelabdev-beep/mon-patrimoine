import type { ReactNode } from 'react'

export default function InfoTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-2">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
