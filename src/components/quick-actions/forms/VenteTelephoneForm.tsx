import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { todayISO } from '@/lib/dates'
import { parseEURInputToCents } from '@/lib/money'
import Field, { inputClass } from '@/components/ui/Field'
import CompteSelect from '@/components/ui/CompteSelect'
import EmptyState from '@/components/ui/EmptyState'

export default function VenteTelephoneForm() {
  const navigate = useNavigate()
  const phones = useAppStore((s) => s.phones)
  const venteTelephone = useAppStore((s) => s.venteTelephone)

  const phonesDisponibles = useMemo(() => phones.filter((p) => p.statut !== 'vendu'), [phones])

  const [phoneId, setPhoneId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [prixVente, setPrixVente] = useState('')
  const [compteId, setCompteId] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  const phone = phones.find((p) => p.id === phoneId)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErreur(null)

    const prixVenteCents = parseEURInputToCents(prixVente)
    if (!phoneId) return setErreur('Choisis un téléphone.')
    if (prixVenteCents == null) return setErreur('Prix de vente invalide.')
    if (!compteId) return setErreur('Choisis un compte de destination.')

    try {
      venteTelephone({ phoneId, date, prixVente: prixVenteCents, compteId })
      navigate(`/telephones/${phoneId}`)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue.')
    }
  }

  if (phonesDisponibles.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6">
        <h1 className="text-xl font-semibold">Vente téléphone</h1>
        <EmptyState title="Aucun téléphone à vendre" description="Ajoute d'abord un téléphone via « Achat téléphone »." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-6">
      <h1 className="mb-4 text-xl font-semibold">Vente téléphone</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Téléphone *">
          <select className={inputClass} value={phoneId} onChange={(e) => setPhoneId(e.target.value)}>
            <option value="" disabled>
              Choisir un téléphone
            </option>
            {phonesDisponibles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.modele} — {p.couleur}
              </option>
            ))}
          </select>
        </Field>
        {phone && <p className="text-sm text-zinc-400">Objectif de vente : {(phone.prixVenteVise / 100).toFixed(2)} €</p>}
        <Field label="Date *">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Prix de vente (€) *">
          <input inputMode="decimal" className={inputClass} value={prixVente} onChange={(e) => setPrixVente(e.target.value)} placeholder="130" />
        </Field>
        <CompteSelect value={compteId} onChange={setCompteId} label="Encaissé sur *" />

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
