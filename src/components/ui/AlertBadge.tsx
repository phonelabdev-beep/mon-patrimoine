import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function AlertBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-amber-400">
      <AlertTriangle size={14} />
      {children}
    </span>
  )
}
