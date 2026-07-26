import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import type { ExpenseCategorie } from '@/types'
import { todayISO } from '@/lib/dates'
import { parseEURInputToCents } from '@/lib/money'
import Field, { inputClass } from '@/components/ui/Field'
import CompteSelect from '@/components/ui/CompteSelect'

const CATEGORIES: { value: ExpenseCategorie; label: string }[] = [
  { value: 'perso', label: 'Personnel' },
  { value: 'pro', label: 'Professionnel' },
  { value: 'outillage', label: 'Outillage' },
  { value: 'transport', label: 'Transport' },
  { value: 'autre', label: 'Autre' },
]

export default function DepenseForm() {
  const navigate = useNavigate()
  const creerDepense = useAppStore((s) => s.creerDepense)

  const [date, setDate] = useState(todayISO())
  const [montant, setMontant] = useState('')
  const [motif, setMotif] = useState('')
  const [categorie, setCategorie] = useState<ExpenseCategorie>('pro')
  const [compteId, setCompteId] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErreur(null)

    const montantCents = parseEURInputToCents(montant)
    if (montantCents == null) return setErreur('Montant invalide.')
    if (!motif.trim()) return setErreur('Le motif est obligatoire.')
    if (!compteId) return setErreur('Choisis un compte.')

    try {
      creerDepense({ date, montant: montantCents, motif: motif.trim(), categorie, compteId })
      navigate('/depenses')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue.')
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-6">
      <h1 className="mb-4 text-xl font-semibold">Dépense</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Date *">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Montant (€) *">
          <input inputMode="decimal" className={inputClass} value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="5" />
        </Field>
        <Field label="Motif *">
          <input className={inputClass} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Essence, matériel…" />
        </Field>
        <Field label="Catégorie *">
          <select className={inputClass} value={categorie} onChange={(e) => setCategorie(e.target.value as ExpenseCategorie)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <CompteSelect value={compteId} onChange={setCompteId} label="Payé depuis *" />

        {erreur && <p className="text-sm text-red-400">{erreur}</p>}

        <div className="mt-2 flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="min-h-[44px] flex-1 rounded-lg border border-zinc-700 text-zinc-300">
            Annuler
          </button>
          <button type="submit" className="min-h-[44px] flex-1 rounded-lg bg-indigo-500 font-medium text-white">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}
