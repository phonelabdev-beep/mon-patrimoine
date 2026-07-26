import type { ReactNode } from 'react'

export const inputClass =
  'min-h-[44px] w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-400 focus:outline-none'

type FieldProps = {
  label: string
  children: ReactNode
}

export default function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-zinc-400">{label}</span>
      {children}
    </label>
  )
}
