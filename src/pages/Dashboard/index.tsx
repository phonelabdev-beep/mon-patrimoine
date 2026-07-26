import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { patrimoine, valeurLiquidation, valeurStockTelephones, patrimoineParMois } from '@/lib/ledger/patrimoine'
import { soldeTotalCash } from '@/lib/ledger/balances'
import { valeurTotaleStockPieces, stockPart } from '@/lib/ledger/stock'
import { resultatMoisCourant } from '@/lib/ledger/bilan'
import { formatMonthFR, monthKey, todayISO } from '@/lib/dates'
import { parseEURInputToCents } from '@/lib/money'
import MoneyText from '@/components/ui/MoneyText'
import AlertBadge from '@/components/ui/AlertBadge'
import Sparkline from '@/components/ui/Sparkline'
import Sheet from '@/components/ui/Sheet'
import { inputClass } from '@/components/ui/Field'

const CARD = 'rounded-xl border border-zinc-800/80 bg-zinc-900 shadow-lg shadow-black/30 ring-1 ring-white/[0.04]'

export default function Dashboard() {
  const navigate = useNavigate()
  const movements = useAppStore((s) => s.movements)
  const phones = useAppStore((s) => s.phones)
  const parts = useAppStore((s) => s.parts)
  const cashAccounts = useAppStore((s) => s.cashAccounts)
  const ajouterSoldeInitial = useAppStore((s) => s.ajouterSoldeInitial)

  const [cashSheetOuvert, setCashSheetOuvert] = useState(false)
  const [direction, setDirection] = useState<'ajouter' | 'retirer'>('ajouter')
  const [montantAjustement, setMontantAjustement] = useState('')
  const [compteId, setCompteId] = useState(cashAccounts[0]?.id ?? '')
  const [erreurAjustement, setErreurAjustement] = useState<string | null>(null)

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

  function ouvrirAjustementCash() {
    setErreurAjustement(null)
    setMontantAjustement('')
    setDirection('ajouter')
    setCompteId(cashAccounts[0]?.id ?? '')
    setCashSheetOuvert(true)
  }

  function handleAjustementCash() {
    setErreurAjustement(null)
    const montantCents = parseEURInputToCents(montantAjustement)
    if (montantCents == null || montantCents <= 0) return setErreurAjustement('Montant invalide.')
    if (!compteId) return setErreurAjustement('Choisis un compte.')
    try {
      ajouterSoldeInitial({
        compteId,
        montant: direction === 'ajouter' ? montantCents : -montantCents,
        date: todayISO(),
        libelle: direction === 'ajouter' ? 'Ajustement cash (ajout)' : 'Ajustement cash (retrait)',
      })
      setCashSheetOuvert(false)
    } catch (err) {
      setErreurAjustement(err instanceof Error ? err.message : 'Erreur inconnue.')
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <div className={`relative overflow-hidden p-5 ${CARD}`}>
        <div
          className="pointer-events-none absolute -top-16 left-1/2 h-48 w-64 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <h1 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Patrimoine total</h1>
          <p className="text-5xl font-semibold tracking-tight text-zinc-50">
            <MoneyText cents={patr} />
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Valeur si je liquide tout : <MoneyText cents={liquidation} className="text-zinc-300" />
          </p>

          {tendance.length >= 2 && (
            <div className="mt-5">
              <Sparkline points={tendance} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button type="button" onClick={ouvrirAjustementCash} className={`p-3 text-left ${CARD}`}>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Cash</p>
          <p className="text-base font-semibold">
            <MoneyText cents={cash} />
          </p>
        </button>
        <button type="button" onClick={() => navigate('/telephones')} className={`p-3 text-left ${CARD}`}>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Téléphones</p>
          <p className="text-base font-semibold">
            <MoneyText cents={stockTel} />
          </p>
        </button>
        <button type="button" onClick={() => navigate('/pieces')} className={`p-3 text-left ${CARD}`}>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Pièces</p>
          <p className="text-base font-semibold">
            <MoneyText cents={stockPieces} />
          </p>
        </button>
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Bénéfice de {formatMonthFR(monthKey(todayISO()))}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div className={`p-3 ${CARD}`}>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Revente</p>
            <p className={`text-lg font-semibold ${resultatMois.revente >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <MoneyText cents={resultatMois.revente} />
            </p>
          </div>
          <div className={`p-3 ${CARD}`}>
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

      <Sheet open={cashSheetOuvert} onClose={() => setCashSheetOuvert(false)} title="Ajustement rapide du cash">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setDirection('ajouter')}
              className={`min-h-[36px] flex-1 rounded-full ${direction === 'ajouter' ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-300'}`}
            >
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => setDirection('retirer')}
              className={`min-h-[36px] flex-1 rounded-full ${direction === 'retirer' ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-300'}`}
            >
              Retirer
            </button>
          </div>
          {cashAccounts.length > 1 && (
            <select className={inputClass} value={compteId} onChange={(e) => setCompteId(e.target.value)}>
              {cashAccounts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          )}
          <input
            inputMode="decimal"
            className={inputClass}
            value={montantAjustement}
            onChange={(e) => setMontantAjustement(e.target.value)}
            placeholder="Montant (€)"
          />
          {erreurAjustement && <p className="text-sm text-red-400">{erreurAjustement}</p>}
          <button type="button" onClick={handleAjustementCash} className="min-h-[44px] rounded-lg bg-indigo-500 font-medium text-white">
            Confirmer
          </button>
        </div>
      </Sheet>
    </div>
  )
}
