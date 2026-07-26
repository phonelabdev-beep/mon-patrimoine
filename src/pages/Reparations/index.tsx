import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import type { Repair } from '@/types'
import { margeReparation } from '@/lib/ledger/repairs'
import { formatDateFR } from '@/lib/dates'
import MoneyText from '@/components/ui/MoneyText'
import EmptyState from '@/components/ui/EmptyState'
import ActionSheet from '@/components/ui/ActionSheet'

export default function Reparations() {
  const repairs = useAppStore((s) => s.repairs)
  const supprimerReparation = useAppStore((s) => s.supprimerReparation)
  const triees = [...repairs].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  const [reparationActive, setReparationActive] = useState<Repair | null>(null)

  function handleSupprimer(repair: Repair) {
    const confirme = window.confirm(
      `Supprimer cette réparation (${repair.appareil}) ? Tous les mouvements associés seront annulés proprement. Action irréversible.`,
    )
    if (!confirme) return
    supprimerReparation(repair.id)
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
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
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setReparationActive(r)}
                  className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-3 text-left"
                >
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
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <ActionSheet
        open={reparationActive != null}
        onClose={() => setReparationActive(null)}
        title={reparationActive?.appareil}
        actions={
          reparationActive ? [{ label: 'Supprimer', destructive: true, onClick: () => handleSupprimer(reparationActive) }] : []
        }
      />
    </div>
  )
}
