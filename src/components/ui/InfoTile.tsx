import type { ReactNode } from 'react'

export default function InfoTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-2">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
