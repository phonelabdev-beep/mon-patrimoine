import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { resultatPeriode } from '@/lib/ledger/bilan'
import { patrimoine, valeurLiquidation } from '@/lib/ledger/patrimoine'
import { soldeTotalCash } from '@/lib/ledger/balances'
import { valeurTotaleStockPieces } from '@/lib/ledger/stock'
import { monthKey, todayISO } from '@/lib/dates'
import MoneyText from '@/components/ui/MoneyText'
import { inputClass } from '@/components/ui/Field'

export default function Bilan() {
  const movements = useAppStore((s) => s.movements)
  const phones = useAppStore((s) => s.phones)

  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')

  const resultat = useMemo(() => resultatPeriode(movements, dateDebut || undefined, dateFin || undefined), [movements, dateDebut, dateFin])
  const beneficeTotal = resultat.revente + resultat.reparation - resultat.depenses

  const cash = soldeTotalCash(movements)
  const valeurPieces = valeurTotaleStockPieces(movements)
  const valeurTelephonesNonVendus = phones.filter((p) => p.statut !== 'vendu').reduce((s, p) => s + p.prixVenteVise, 0)

  function preselectionnerMois() {
    const key = monthKey(todayISO())
    setDateDebut(`${key}-01`)
    setDateFin(`${key}-31`)
  }

  function reinitialiserPeriode() {
    setDateDebut('')
    setDateFin('')
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-6">
      <h1 className="mb-4 text-xl font-semibold">Bilan</h1>

      <div className="mb-4 flex gap-2">
        <input type="date" className={inputClass} value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
        <input type="date" className={inputClass} value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
      </div>
      <div className="mb-6 flex gap-2 text-sm">
        <button type="button" onClick={preselectionnerMois} className="min-h-[36px] rounded-full bg-zinc-800 px-3 text-zinc-300">
          Ce mois
        </button>
        <button type="button" onClick={reinitialiserPeriode} className="min-h-[36px] rounded-full bg-zinc-800 px-3 text-zinc-300">
          Toute la période
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Revente</p>
          <p className={`text-lg font-semibold ${resultat.revente >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            <MoneyText cents={resultat.revente} />
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Réparations</p>
          <p className={`text-lg font-semibold ${resultat.reparation >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            <MoneyText cents={resultat.reparation} />
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Dépenses</p>
          <p className="text-lg font-semibold text-red-400">
            <MoneyText cents={resultat.depenses} />
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Bénéfice net</p>
          <p className={`text-lg font-semibold ${beneficeTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            <MoneyText cents={beneficeTotal} />
          </p>
        </div>
      </div>

      <h2 className="mb-2 mt-8 text-xs font-medium uppercase tracking-wide text-zinc-500">Simulation de liquidation totale</h2>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-3xl font-semibold text-zinc-50">
          <MoneyText cents={valeurLiquidation(movements, phones)} />
        </p>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-zinc-400">
          <li>
            Cash : <MoneyText cents={cash} />
          </li>
          <li>
            Téléphones en stock (objectif de vente) : <MoneyText cents={valeurTelephonesNonVendus} />
          </li>
          <li>
            Pièces en stock : <MoneyText cents={valeurPieces} />
          </li>
        </ul>
      </div>

      <h2 className="mb-2 mt-6 text-xs font-medium uppercase tracking-wide text-zinc-500">Patrimoine actuel</h2>
      <p className="text-lg font-semibold">
        <MoneyText cents={patrimoine(movements)} />
      </p>
    </div>
  )
}
