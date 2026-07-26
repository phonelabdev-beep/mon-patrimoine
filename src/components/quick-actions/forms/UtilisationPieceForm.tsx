import { useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { todayISO } from '@/lib/dates'
import { stockPart, coutUnitaireMoyen } from '@/lib/ledger/stock'
import Field, { inputClass } from '@/components/ui/Field'
import EmptyState from '@/components/ui/EmptyState'
import MoneyText from '@/components/ui/MoneyText'

export default function UtilisationPieceForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const preselection = location.state as { partId?: string } | null
  const parts = useAppStore((s) => s.parts)
  const phones = useAppStore((s) => s.phones)
  const movements = useAppStore((s) => s.movements)
  const utilisationPieceSurTelephone = useAppStore((s) => s.utilisationPieceSurTelephone)

  const phonesDisponibles = useMemo(() => phones.filter((p) => p.statut !== 'vendu'), [phones])

  const [date, setDate] = useState(todayISO())
  const [partId, setPartId] = useState(preselection?.partId ?? '')
  const [phoneId, setPhoneId] = useState('')
  const [qte, setQte] = useState('1')
  const [erreur, setErreur] = useState<string | null>(null)

  const stock = partId ? stockPart(movements, partId) : null
  const part = parts.find((p) => p.id === partId)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErreur(null)

    const qteNum = parseInt(qte, 10)
    if (!partId) return setErreur('Choisis une pièce.')
    if (!phoneId) return setErreur('Choisis un téléphone.')
    if (!Number.isFinite(qteNum) || qteNum <= 0) return setErreur('Quantité invalide.')

    try {
      utilisationPieceSurTelephone({
        date,
        partId,
        qte: qteNum,
        phoneId,
        libelle: `${part?.nom ?? 'Pièce'} montée sur téléphone`,
      })
      navigate(`/telephones/${phoneId}`)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue.')
    }
  }

  if (parts.length === 0 || phonesDisponibles.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4">
        <h1 className="text-xl font-semibold">Utilisation pièce</h1>
        <EmptyState
          title="Rien à monter pour l'instant"
          description={
            parts.length === 0
              ? "Ajoute d'abord des pièces via « Achat pièce(s) »."
              : "Ajoute d'abord un téléphone en stock via « Achat téléphone »."
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <h1 className="mb-4 text-xl font-semibold">Utilisation pièce</h1>
      <p className="mb-4 text-sm text-zinc-400">Pour un téléphone de ton propre stock. Pour une réparation client, utilise « Réparation client ».</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Date *">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Pièce *">
          <select className={inputClass} value={partId} onChange={(e) => setPartId(e.target.value)}>
            <option value="" disabled>
              Choisir une pièce
            </option>
            {parts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        </Field>
        {stock && (
          <p className="text-sm text-zinc-400">
            Stock disponible : {stock.quantite} — coût moyen : <MoneyText cents={coutUnitaireMoyen(stock)} />
          </p>
        )}
        <Field label="Quantité *">
          <input inputMode="numeric" className={inputClass} value={qte} onChange={(e) => setQte(e.target.value)} />
        </Field>
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
