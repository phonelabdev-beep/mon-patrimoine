import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { patrimoine, valeurLiquidation, valeurStockTelephones, patrimoineParMois } from '@/lib/ledger/patrimoine'
import { soldeTotalCash } from '@/lib/ledger/balances'
import { valeurTotaleStockPieces, stockPart } from '@/lib/ledger/stock'
import { resultatMoisCourant } from '@/lib/ledger/bilan'
import { formatMonthFR, monthKey, todayISO } from '@/lib/dates'
import MoneyText from '@/components/ui/MoneyText'
import AlertBadge from '@/components/ui/AlertBadge'
import Sparkline from '@/components/ui/Sparkline'

export default function Dashboard() {
  const movements = useAppStore((s) => s.movements)
  const phones = useAppStore((s) => s.phones)
  const parts = useAppStore((s) => s.parts)

  const patr = patrimoine(movements)
  const liquidation = valeurLiquidation(movements, phones)
  const cash = soldeTotalCash(movements)
  const stockTel = valeurStockTelephones(movements)
  const stockPieces = valeurTotaleStockPieces(movements)
  const resultatMois = resultatMoisCourant(movements)

  const tendance = patrimoineParMois(movements).map((p) => ({
    label: formatMonthFR(p.mois).slice(0, 3),
    value: p.valeur,
  }))

  const alertes = parts.filter((p) => stockPart(movements, p.id).quantite <= p.seuilAlerte)

  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-6">
      <h1 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Patrimoine total</h1>
      <p className="text-5xl font-semibold tracking-tight text-zinc-50">
        <MoneyText cents={patr} />
      </p>
      <p className="mt-1 text-sm text-zinc-400">
        Valeur si je liquide tout : <MoneyText cents={liquidation} className="text-zinc-300" />
      </p>

      {tendance.length >= 2 && <div className="mt-6">
        <Sparkline points={tendance} />
      </div>}

      <div className="mt-6 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Cash</p>
          <p className="text-base font-semibold">
            <MoneyText cents={cash} />
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Téléphones</p>
          <p className="text-base font-semibold">
            <MoneyText cents={stockTel} />
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Pièces</p>
          <p className="text-base font-semibold">
            <MoneyText cents={stockPieces} />
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Bénéfice de {formatMonthFR(monthKey(todayISO()))}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Revente</p>
            <p className={`text-lg font-semibold ${resultatMois.revente >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <MoneyText cents={resultatMois.revente} />
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Réparations</p>
            <p className={`text-lg font-semibold ${resultatMois.reparation >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <MoneyText cents={resultatMois.reparation} />
            </p>
          </div>
        </div>
      </div>

      {alertes.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Alertes stock</h2>
          <ul className="flex flex-col gap-1">
            {alertes.map((p) => (
              <li key={p.id}>
                <Link to={`/pieces/${p.id}`} className="block rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-sm">
                  <AlertBadge>
                    {p.nom} — {stockPart(movements, p.id).quantite} restante(s)
                  </AlertBadge>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
