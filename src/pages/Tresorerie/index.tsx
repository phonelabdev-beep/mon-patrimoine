import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { soldesTousComptes } from '@/lib/ledger/balances'
import { formatDateFR, todayISO } from '@/lib/dates'
import { parseEURInputToCents } from '@/lib/money'
import MoneyText from '@/components/ui/MoneyText'
import EmptyState from '@/components/ui/EmptyState'
import { inputClass } from '@/components/ui/Field'

export default function Tresorerie() {
  const cashAccounts = useAppStore((s) => s.cashAccounts)
  const movements = useAppStore((s) => s.movements)
  const transfertCash = useAppStore((s) => s.transfertCash)
  const ajouterSoldeInitial = useAppStore((s) => s.ajouterSoldeInitial)

  const [compteSourceId, setCompteSourceId] = useState('')
  const [compteDestId, setCompteDestId] = useState('')
  const [montant, setMontant] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  const [compteApportId, setCompteApportId] = useState('')
  const [montantApport, setMontantApport] = useState('')
  const [erreurApport, setErreurApport] = useState<string | null>(null)
  const [messageApport, setMessageApport] = useState<string | null>(null)

  function handleApport() {
    setErreurApport(null)
    setMessageApport(null)
    const montantCents = parseEURInputToCents(montantApport)
    if (!compteApportId) return setErreurApport('Choisis un compte.')
    if (montantCents == null || montantCents <= 0) return setErreurApport('Montant invalide.')
    ajouterSoldeInitial({ compteId: compteApportId, montant: montantCents, date: todayISO(), libelle: 'Apport' })
    setMontantApport('')
    setMessageApport('Solde ajouté.')
  }

  const soldes = soldesTousComptes(
    movements,
    cashAccounts.map((c) => c.id),
  )

  function handleTransfert() {
    setErreur(null)
    const montantCents = parseEURInputToCents(montant)
    if (!compteSourceId || !compteDestId) return setErreur('Choisis les deux comptes.')
    if (compteSourceId === compteDestId) return setErreur('Les deux comptes doivent être différents.')
    if (montantCents == null || montantCents <= 0) return setErreur('Montant invalide.')
    transfertCash({
      date: todayISO(),
      compteSourceId,
      compteDestId,
      montant: montantCents,
      libelle: 'Transfert entre comptes',
    })
    setMontant('')
  }
  const mouvementsCash = [...movements]
    .filter((m) => m.lignes.some((l) => l.compte.startsWith('cash:')))
    .sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.createdAt < b.createdAt ? 1 : -1))

  if (cashAccounts.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4">
        <h1 className="mb-4 text-xl font-semibold">Trésorerie</h1>
        <EmptyState
          title="Aucun compte pour l'instant"
          description="Un compte se crée automatiquement dès ta première action rapide, ou depuis Réglages."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <h1 className="mb-4 text-xl font-semibold">Trésorerie</h1>

      <ul className="mb-6 flex flex-col gap-2">
        {cashAccounts.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-3">
            <span className="font-medium">{c.nom}</span>
            <MoneyText cents={soldes[c.id] ?? 0} className="font-medium" />
          </li>
        ))}
      </ul>

      <div className="mb-6 flex flex-col gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-3">
        <h2 className="text-sm font-medium text-zinc-400">Ajouter un solde (apport d'argent déjà possédé)</h2>
        <select className={inputClass} value={compteApportId} onChange={(e) => setCompteApportId(e.target.value)}>
          <option value="" disabled>
            Compte
          </option>
          {cashAccounts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
        <input
          inputMode="decimal"
          className={inputClass}
          value={montantApport}
          onChange={(e) => setMontantApport(e.target.value)}
          placeholder="Montant (€)"
        />
        {erreurApport && <p className="text-sm text-red-400">{erreurApport}</p>}
        {messageApport && <p className="text-sm text-emerald-400">{messageApport}</p>}
        <button type="button" onClick={handleApport} className="min-h-[44px] rounded-lg bg-indigo-500 font-medium text-white">
          Ajouter au solde
        </button>
      </div>

      {cashAccounts.length >= 2 && (
        <div className="mb-6 flex flex-col gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-3">
          <h2 className="text-sm font-medium text-zinc-400">Transférer entre mes comptes</h2>
          <select className={inputClass} value={compteSourceId} onChange={(e) => setCompteSourceId(e.target.value)}>
            <option value="" disabled>
              Depuis
            </option>
            {cashAccounts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
          <select className={inputClass} value={compteDestId} onChange={(e) => setCompteDestId(e.target.value)}>
            <option value="" disabled>
              Vers
            </option>
            {cashAccounts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
          <input inputMode="decimal" className={inputClass} value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="Montant (€)" />
          {erreur && <p className="text-sm text-red-400">{erreur}</p>}
          <button type="button" onClick={handleTransfert} className="min-h-[44px] rounded-lg bg-indigo-500 font-medium text-white">
            Transférer
          </button>
        </div>
      )}

      <h2 className="mb-2 text-sm font-medium text-zinc-400">Historique</h2>
      {mouvementsCash.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun mouvement de cash pour l'instant.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {mouvementsCash.map((m) => {
            const lignesCash = m.lignes.filter((l) => l.compte.startsWith('cash:'))
            return (
              <li key={m.id} className="rounded-lg border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>{m.libelle}</span>
                  <span className="text-zinc-400">{formatDateFR(m.date)}</span>
                </div>
                <div className="mt-1 flex flex-col gap-0.5 text-xs text-zinc-400">
                  {lignesCash.map((l, i) => {
                    const compteId = l.compte.slice('cash:'.length)
                    const compte = cashAccounts.find((c) => c.id === compteId)
                    return (
                      <div key={i} className="flex justify-between">
                        <span>{compte?.nom ?? compteId}</span>
                        <MoneyText cents={l.montant} className={l.montant >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                      </div>
                    )
                  })}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
