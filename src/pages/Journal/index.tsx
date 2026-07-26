import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import type { Movement, MovementType } from '@/types'
import { formatDateFR, todayISO } from '@/lib/dates'
import MoneyText from '@/components/ui/MoneyText'
import EmptyState from '@/components/ui/EmptyState'
import { inputClass } from '@/components/ui/Field'

const TYPE_LABELS: Record<MovementType, string> = {
  achat_telephone: 'Achat téléphone',
  achat_piece: 'Achat pièce(s)',
  utilisation_piece: 'Utilisation pièce',
  reparation: 'Réparation',
  vente_telephone: 'Vente téléphone',
  depense: 'Dépense',
  ajustement: 'Ajustement',
  transfert_cash: 'Transfert cash',
  solde_initial: 'Solde de départ',
}

export default function Journal() {
  const movements = useAppStore((s) => s.movements)
  const phones = useAppStore((s) => s.phones)
  const repairs = useAppStore((s) => s.repairs)
  const ajusterMouvement = useAppStore((s) => s.ajusterMouvement)

  const [typeFiltre, setTypeFiltre] = useState<MovementType | 'tous'>('tous')
  const [recherche, setRecherche] = useState('')
  const [correctionId, setCorrectionId] = useState<string | null>(null)
  const [libelleCorrection, setLibelleCorrection] = useState('')
  const [erreurCorrection, setErreurCorrection] = useState<string | null>(null)

  const dejaCorriges = useMemo(() => {
    const ids = new Set<string>()
    for (const m of movements) {
      if (m.type === 'ajustement' && m.refId) ids.add(m.refId)
    }
    return ids
  }, [movements])

  const filtres = useMemo(() => {
    return [...movements]
      .filter((m) => typeFiltre === 'tous' || m.type === typeFiltre)
      .filter((m) => m.libelle.toLowerCase().includes(recherche.trim().toLowerCase()))
      .sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.createdAt < b.createdAt ? 1 : -1))
  }, [movements, typeFiltre, recherche])

  function lienRef(m: Movement) {
    if (!m.refId) return null
    const phone = phones.find((p) => p.id === m.refId)
    if (phone) return { to: `/telephones/${phone.id}`, label: phone.modele }
    const repair = repairs.find((r) => r.id === m.refId)
    if (repair) return { to: '/reparations', label: repair.appareil }
    return null
  }

  function ouvrirCorrection(m: Movement) {
    setErreurCorrection(null)
    setCorrectionId(m.id)
    setLibelleCorrection(`Correction : ${m.libelle}`)
  }

  function confirmerCorrection(m: Movement) {
    if (!libelleCorrection.trim()) return
    try {
      ajusterMouvement(m.id, libelleCorrection.trim(), todayISO())
      setCorrectionId(null)
      setErreurCorrection(null)
    } catch (err) {
      setErreurCorrection(err instanceof Error ? err.message : 'Erreur inconnue.')
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-6">
      <h1 className="mb-4 text-xl font-semibold">Journal</h1>

      <div className="mb-4 flex flex-col gap-2">
        <input
          className={inputClass}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par libellé…"
        />
        <select className={inputClass} value={typeFiltre} onChange={(e) => setTypeFiltre(e.target.value as MovementType | 'tous')}>
          <option value="tous">Tous les types</option>
          {(Object.keys(TYPE_LABELS) as MovementType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {filtres.length === 0 ? (
        <EmptyState title="Aucun mouvement" description="Le journal se remplit à mesure que tu utilises l'app." />
      ) : (
        <ul className="flex flex-col gap-2">
          {filtres.map((m) => {
            const ref = lienRef(m)
            return (
              <li key={m.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{TYPE_LABELS[m.type]}</span>
                  <span className="text-zinc-400">{formatDateFR(m.date)}</span>
                </div>
                <p className="mt-1 text-zinc-300">{m.libelle}</p>
                {ref && (
                  <Link to={ref.to} className="text-xs text-indigo-400 underline">
                    {ref.label}
                  </Link>
                )}
                <ul className="mt-2 flex flex-col gap-0.5 text-xs text-zinc-500">
                  {m.lignes.map((l, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{l.compte}</span>
                      <MoneyText cents={l.montant} className={l.montant >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                    </li>
                  ))}
                </ul>

                {correctionId === m.id ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <input className={inputClass} value={libelleCorrection} onChange={(e) => setLibelleCorrection(e.target.value)} />
                    {erreurCorrection && <p className="text-xs text-red-400">{erreurCorrection}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => confirmerCorrection(m)}
                        className="min-h-[36px] flex-1 rounded-lg bg-indigo-500 text-xs font-medium text-white"
                      >
                        Confirmer la correction
                      </button>
                      <button
                        type="button"
                        onClick={() => setCorrectionId(null)}
                        className="min-h-[36px] rounded-lg border border-zinc-700 px-3 text-xs text-zinc-300"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : m.type === 'ajustement' ? null : dejaCorriges.has(m.id) ? (
                  <p className="mt-2 text-xs text-zinc-500">Déjà corrigé</p>
                ) : (
                  <button type="button" onClick={() => ouvrirCorrection(m)} className="mt-2 text-xs text-indigo-400 underline">
                    Corriger (annule ce mouvement)
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
