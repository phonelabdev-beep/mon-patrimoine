import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { todayISO } from '@/lib/dates'
import { parseEURInputToCents } from '@/lib/money'
import { resolveCompteParDefautId } from '@/lib/defaultAccount'
import Field, { inputClass } from '@/components/ui/Field'

export default function AchatTelephoneForm() {
  const navigate = useNavigate()
  const achatTelephone = useAppStore((s) => s.achatTelephone)

  const [modele, setModele] = useState('')
  const [couleur, setCouleur] = useState('')
  const [stockage, setStockage] = useState('')
  const [dateAchat, setDateAchat] = useState(todayISO())
  const [prixAchat, setPrixAchat] = useState('')
  const [reparationEstimee, setReparationEstimee] = useState('')
  const [prixVenteVise, setPrixVenteVise] = useState('')
  const [valeurPieceRecuperable, setValeurPieceRecuperable] = useState('')
  const [notes, setNotes] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErreur(null)

    const prixAchatCents = parseEURInputToCents(prixAchat)
    const reparationEstimeeCents = parseEURInputToCents(reparationEstimee || '0') ?? 0
    const prixVenteViseCents = parseEURInputToCents(prixVenteVise)
    const valeurRecuperableCents = valeurPieceRecuperable.trim() === '' ? 0 : parseEURInputToCents(valeurPieceRecuperable)

    if (!modele.trim() || !couleur.trim()) return setErreur('Modèle et couleur sont obligatoires.')
    if (prixAchatCents == null) return setErreur('Prix d’achat invalide.')
    if (prixVenteViseCents == null) return setErreur('Prix de vente visé invalide.')
    if (valeurRecuperableCents == null) return setErreur('Valeur pièce récupérable invalide.')

    try {
      achatTelephone({
        modele: modele.trim(),
        couleur: couleur.trim(),
        stockage: stockage.trim() || undefined,
        dateAchat,
        prixAchat: prixAchatCents,
        reparationEstimee: reparationEstimeeCents,
        prixVenteVise: prixVenteViseCents,
        valeurPieceRecuperable: valeurRecuperableCents,
        compteId: resolveCompteParDefautId(),
        notes: notes.trim() || undefined,
      })
      navigate('/telephones')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue.')
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <h1 className="mb-4 text-xl font-semibold">Achat téléphone</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Modèle *">
          <input className={inputClass} value={modele} onChange={(e) => setModele(e.target.value)} placeholder="iPhone 12 Pro" />
        </Field>
        <Field label="Couleur *">
          <input className={inputClass} value={couleur} onChange={(e) => setCouleur(e.target.value)} placeholder="Noir" />
        </Field>
        <Field label="Stockage">
          <input className={inputClass} value={stockage} onChange={(e) => setStockage(e.target.value)} placeholder="128 Go" />
        </Field>
        <Field label="Date d'achat *">
          <input type="date" className={inputClass} value={dateAchat} onChange={(e) => setDateAchat(e.target.value)} />
        </Field>
        <Field label="Prix d'achat, tout compris (€) *">
          <input inputMode="decimal" className={inputClass} value={prixAchat} onChange={(e) => setPrixAchat(e.target.value)} placeholder="80" />
        </Field>
        <Field label="Valeur pièce d'origine récupérable estimée (€)">
          <input
            inputMode="decimal"
            className={inputClass}
            value={valeurPieceRecuperable}
            onChange={(e) => setValeurPieceRecuperable(e.target.value)}
            placeholder="Ex : écran fissuré mais fonctionnel"
          />
        </Field>
        <Field label="Réparation estimée (€)">
          <input inputMode="decimal" className={inputClass} value={reparationEstimee} onChange={(e) => setReparationEstimee(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Prix de vente visé (€) *">
          <input inputMode="decimal" className={inputClass} value={prixVenteVise} onChange={(e) => setPrixVenteVise(e.target.value)} placeholder="130" />
        </Field>
        <Field label="Notes">
          <textarea className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
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
