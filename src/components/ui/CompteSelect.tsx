import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { CashAccountType } from '@/types'
import { parseEURInputToCents } from '@/lib/money'
import { todayISO } from '@/lib/dates'
import { inputClass } from './Field'

const TYPES: { value: CashAccountType; label: string }[] = [
  { value: 'especes', label: 'Espèces' },
  { value: 'banque', label: 'Banque' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'vinted', label: 'Vinted' },
  { value: 'autre', label: 'Autre' },
]

type CompteSelectProps = {
  value: string
  onChange: (id: string) => void
  label?: string
}

/**
 * Sélecteur de compte cash, avec création inline si aucun compte n'existe
 * encore (l'app démarre vide : Réglages n'est pas un préalable obligatoire).
 * Un solde de départ optionnel peut être saisi à la création, pour l'argent
 * déjà possédé avant de commencer à utiliser l'app.
 */
export default function CompteSelect({ value, onChange, label = 'Compte' }: CompteSelectProps) {
  const cashAccounts = useAppStore((s) => s.cashAccounts)
  const ajouterCompteCash = useAppStore((s) => s.ajouterCompteCash)
  const ajouterSoldeInitial = useAppStore((s) => s.ajouterSoldeInitial)
  const [creating, setCreating] = useState(cashAccounts.length === 0)
  const [nom, setNom] = useState('')
  const [type, setType] = useState<CashAccountType>('especes')
  const [soldeDepart, setSoldeDepart] = useState('')

  function creerEtSelectionner() {
    if (!nom.trim()) return
    const compte = ajouterCompteCash({ nom: nom.trim(), type })
    const soldeCents = parseEURInputToCents(soldeDepart)
    if (soldeCents != null && soldeCents > 0) {
      ajouterSoldeInitial({ compteId: compte.id, montant: soldeCents, date: todayISO(), libelle: 'Solde de départ' })
    }
    onChange(compte.id)
    setNom('')
    setSoldeDepart('')
    setCreating(false)
  }

  if (creating) {
    return (
      <div>
        <span className="mb-1 block text-sm text-zinc-400">{label}</span>
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-700 p-3">
          <input
            className={inputClass}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Nom du compte (ex : Espèces, Compte pro…)"
          />
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as CashAccountType)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            inputMode="decimal"
            className={inputClass}
            value={soldeDepart}
            onChange={(e) => setSoldeDepart(e.target.value)}
            placeholder="Solde de départ (€), optionnel"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={creerEtSelectionner}
              className="min-h-[44px] flex-1 rounded-lg bg-indigo-500 font-medium text-white"
            >
              Créer le compte
            </button>
            {cashAccounts.length > 0 && (
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="min-h-[44px] rounded-lg border border-zinc-700 px-3 text-zinc-300"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <span className="mb-1 block text-sm text-zinc-400">{label}</span>
      <div className="flex gap-2">
        <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>
            Choisir un compte
          </option>
          {cashAccounts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="min-h-[44px] shrink-0 rounded-lg border border-zinc-700 px-3 text-sm text-indigo-400"
        >
          + Compte
        </button>
      </div>
    </div>
  )
}
