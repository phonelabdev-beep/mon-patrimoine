import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import type { Expense, ExpenseCategorie } from '@/types'
import { formatDateFR, formatMonthFR, monthKey } from '@/lib/dates'
import MoneyText from '@/components/ui/MoneyText'
import EmptyState from '@/components/ui/EmptyState'

const CATEGORIE_LABELS: Record<ExpenseCategorie, string> = {
  perso: 'Personnel',
  pro: 'Professionnel',
  outillage: 'Outillage',
  transport: 'Transport',
  autre: 'Autre',
}

export default function Depenses() {
  const expenses = useAppStore((s) => s.expenses)
  const triees = [...expenses].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  const parMois = new Map<string, Expense[]>()
  for (const e of triees) {
    const key = monthKey(e.date)
    const arr = parMois.get(key)
    if (arr) arr.push(e)
    else parMois.set(key, [e])
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dépenses</h1>
        <Link to="/nouveau/depense" className="flex min-h-[44px] items-center rounded-lg bg-indigo-500 px-3 text-sm font-medium text-white">
          + Nouvelle
        </Link>
      </div>

      {triees.length === 0 ? (
        <EmptyState title="Aucune dépense" description="Enregistre ta première dépense." />
      ) : (
        [...parMois.entries()].map(([mois, list]) => {
          const total = list.reduce((s, e) => s + e.montant, 0)
          return (
            <div key={mois} className="mb-6">
              <div className="mb-2 flex items-center justify-between text-sm text-zinc-400">
                <span className="capitalize">{formatMonthFR(mois)}</span>
                <MoneyText cents={total} />
              </div>
              <ul className="flex flex-col gap-2">
                {list.map((e) => (
                  <li key={e.id} className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-3 text-sm">
                    <div>
                      <p className="font-medium">{e.motif}</p>
                      <p className="text-zinc-400">
                        {formatDateFR(e.date)} · {CATEGORIE_LABELS[e.categorie]}
                      </p>
                    </div>
                    <MoneyText cents={e.montant} className="text-red-400" />
                  </li>
                ))}
              </ul>
            </div>
          )
        })
      )}
    </div>
  )
}
