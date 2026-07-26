import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { margeReparation } from '@/lib/ledger/repairs'
import { formatDateFR } from '@/lib/dates'
import MoneyText from '@/components/ui/MoneyText'
import EmptyState from '@/components/ui/EmptyState'

export default function Reparations() {
  const repairs = useAppStore((s) => s.repairs)
  const triees = [...repairs].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Réparations</h1>
        <Link to="/nouveau/reparation" className="flex min-h-[44px] items-center rounded-lg bg-indigo-500 px-3 text-sm font-medium text-white">
          + Nouvelle
        </Link>
      </div>

      {triees.length === 0 ? (
        <EmptyState title="Aucune réparation" description="Enregistre ta première réparation client." />
      ) : (
        <ul className="flex flex-col gap-2">
          {triees.map((r) => {
            const marge = margeReparation(r)
            return (
              <li key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{r.appareil}</p>
                  <MoneyText cents={r.prixFacture} className="font-medium" />
                </div>
                <div className="mt-1 flex items-center justify-between text-sm text-zinc-400">
                  <span>
                    {formatDateFR(r.date)}
                    {r.client ? ` · ${r.client}` : ''}
                  </span>
                  <span className={marge >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    Marge : <MoneyText cents={marge} />
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
