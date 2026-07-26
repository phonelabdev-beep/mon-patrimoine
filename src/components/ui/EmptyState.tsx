import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center text-zinc-400">
      {icon}
      <p className="text-base font-medium text-zinc-200">{title}</p>
      {description && <p className="text-sm">{description}</p>}
    </div>
  )
}
