import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import type { Phone, PhoneStatut } from '@/types'
import { ecartEstimation, beneficeReel, piecesMonteesSurPhone } from '@/lib/ledger/phones'
import { formatDateFR } from '@/lib/dates'
import { parseEURInputToCents, formatEUR } from '@/lib/money'
import MoneyText from '@/components/ui/MoneyText'
import EmptyState from '@/components/ui/EmptyState'
import Field, { inputClass } from '@/components/ui/Field'

const STATUT_OPTIONS: { value: PhoneStatut; label: string }[] = [
  { value: 'en_stock', label: 'En stock' },
  { value: 'en_reparation', label: 'En réparation' },
  { value: 'en_vente', label: 'En vente' },
]

type Draft = {
  modele: string
  couleur: string
  stockage: string
  dateAchat: string
  prixAchat: string
  reparationEstimee: string
  prixVenteVise: string
  valeurPieceRecuperable: string
  statut: PhoneStatut
  notes: string
}

function toDraft(p: Phone): Draft {
  return {
    modele: p.modele,
    couleur: p.couleur,
    stockage: p.stockage ?? '',
    dateAchat: p.dateAchat,
    prixAchat: (p.prixAchat / 100).toString(),
    reparationEstimee: (p.reparationEstimee / 100).toString(),
    prixVenteVise: (p.prixVenteVise / 100).toString(),
    valeurPieceRecuperable: p.valeurPieceRecuperable ? (p.valeurPieceRecuperable / 100).toString() : '',
    statut: p.statut,
    notes: p.notes ?? '',
  }
}

export default function PhoneDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const phones = useAppStore((s) => s.phones)
  const parts = useAppStore((s) => s.parts)
  const movements = useAppStore((s) => s.movements)
  const modifierTelephone = useAppStore((s) => s.modifierTelephone)
  const supprimerTelephone = useAppStore((s) => s.supprimerTelephone)

  const phone = phones.find((p) => p.id === id)
  const [draft, setDraft] = useState<Draft | null>(phone ? toDraft(phone) : null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (phone) setDraft(toDraft(phone))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone?.id])

  if (!phone || !draft) {
    return (
      <div className="mx-auto max-w-md px-4">
        <EmptyState title="Téléphone introuvable" />
      </div>
    )
  }

  const pieces = piecesMonteesSurPhone(movements, phone.id)

  // Aperçu en direct basé sur le brouillon (pas encore enregistré).
  const prixAchatDraft = parseEURInputToCents(draft.prixAchat) ?? phone.prixAchat
  const reparationEstimeeDraft = parseEURInputToCents(draft.reparationEstimee) ?? phone.reparationEstimee
  const prixVenteViseDraft = parseEURInputToCents(draft.prixVenteVise) ?? phone.prixVenteVise
  const valeurRecuperableDraft = parseEURInputToCents(draft.valeurPieceRecuperable) ?? 0
  const coutEffectifDraft = prixAchatDraft - valeurRecuperableDraft
  const margeDraft = prixVenteViseDraft - coutEffectifDraft - reparationEstimeeDraft
  const ecart = ecartEstimation(movements, phone)
  const reel = beneficeReel(phone)

  function handleEnregistrer() {
    setErreur(null)
    setMessage(null)
    const prixAchatCents = parseEURInputToCents(draft!.prixAchat)
    const reparationEstimeeCents = parseEURInputToCents(draft!.reparationEstimee || '0') ?? 0
    const prixVenteViseCents = parseEURInputToCents(draft!.prixVenteVise)
    const valeurRecuperableCents = draft!.valeurPieceRecuperable.trim() === '' ? 0 : parseEURInputToCents(draft!.valeurPieceRecuperable)
    if (!draft!.modele.trim() || !draft!.couleur.trim()) return setErreur('Modèle et couleur sont obligatoires.')
    if (prixAchatCents == null) return setErreur("Prix d'achat invalide.")
    if (prixVenteViseCents == null) return setErreur('Prix de vente visé invalide.')
    if (valeurRecuperableCents == null) return setErreur('Valeur pièce récupérable invalide.')

    try {
      modifierTelephone(phone!.id, {
        modele: draft!.modele.trim(),
        couleur: draft!.couleur.trim(),
        stockage: draft!.stockage.trim() || undefined,
        dateAchat: draft!.dateAchat,
        prixAchat: prixAchatCents,
        reparationEstimee: reparationEstimeeCents,
        prixVenteVise: prixVenteViseCents,
        valeurPieceRecuperable: valeurRecuperableCents,
        statut: draft!.statut,
        notes: draft!.notes.trim() || undefined,
      })
      setMessage('Modifications enregistrées.')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue.')
    }
  }

  function handleSupprimer() {
    const confirme = window.confirm(
      `Supprimer ${phone!.modele} ? Tous les mouvements associés seront annulés proprement. Action irréversible.`,
    )
    if (!confirme) return
    supprimerTelephone(phone!.id)
    navigate('/telephones')
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <button type="button" onClick={() => navigate(-1)} className="mb-2 text-sm text-zinc-400">
        ← Retour
      </button>

      <div className="mb-4 flex gap-2">
        {phone.statut !== 'vendu' && (
          <button
            type="button"
            onClick={() => navigate('/nouveau/vente-telephone', { state: { phoneId: phone.id } })}
            className="min-h-[44px] flex-1 rounded-lg bg-emerald-600 font-medium text-white"
          >
            Vendre
          </button>
        )}
        <button
          type="button"
          onClick={handleSupprimer}
          className="min-h-[44px] flex-1 rounded-lg border border-red-900/50 bg-red-950/30 font-medium text-red-400"
        >
          Supprimer
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Modèle *">
            <input className={inputClass} value={draft.modele} onChange={(e) => setDraft({ ...draft, modele: e.target.value })} />
          </Field>
          <Field label="Couleur *">
            <input className={inputClass} value={draft.couleur} onChange={(e) => setDraft({ ...draft, couleur: e.target.value })} />
          </Field>
        </div>
        <Field label="Stockage">
          <input className={inputClass} value={draft.stockage} onChange={(e) => setDraft({ ...draft, stockage: e.target.value })} />
        </Field>
        <Field label="Date d'achat">
          <input type="date" className={inputClass} value={draft.dateAchat} onChange={(e) => setDraft({ ...draft, dateAchat: e.target.value })} />
        </Field>
        <Field label="Statut">
          {phone.statut === 'vendu' ? (
            <p className={`${inputClass} flex items-center text-zinc-400`}>Vendu (définitif)</p>
          ) : (
            <select
              className={inputClass}
              value={draft.statut}
              onChange={(e) => setDraft({ ...draft, statut: e.target.value as PhoneStatut })}
            >
              {STATUT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label={`Prix d'achat, tout compris (€)${phone.statut === 'vendu' ? ' — verrouillé après vente' : ' *'}`}>
          <input
            inputMode="decimal"
            disabled={phone.statut === 'vendu'}
            className={`${inputClass} ${phone.statut === 'vendu' ? 'opacity-50' : ''}`}
            value={draft.prixAchat}
            onChange={(e) => setDraft({ ...draft, prixAchat: e.target.value })}
          />
        </Field>
        <Field label="Valeur pièce d'origine récupérable estimée (€)">
          <input
            inputMode="decimal"
            className={inputClass}
            value={draft.valeurPieceRecuperable}
            onChange={(e) => setDraft({ ...draft, valeurPieceRecuperable: e.target.value })}
            placeholder="Ex : écran fissuré mais fonctionnel"
          />
        </Field>
        <Field label="Réparation estimée (€)">
          <input
            inputMode="decimal"
            className={inputClass}
            value={draft.reparationEstimee}
            onChange={(e) => setDraft({ ...draft, reparationEstimee: e.target.value })}
          />
        </Field>
        <Field label="Prix de vente visé (€) *">
          <input
            inputMode="decimal"
            className={inputClass}
            value={draft.prixVenteVise}
            onChange={(e) => setDraft({ ...draft, prixVenteVise: e.target.value })}
          />
        </Field>
        <Field label="Notes">
          <textarea className={inputClass} rows={3} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </Field>

        {erreur && <p className="text-sm text-red-400">{erreur}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        <button type="button" onClick={handleEnregistrer} className="min-h-[44px] rounded-lg bg-indigo-500 font-medium text-white">
          Enregistrer les modifications
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Coût effectif</p>
          <p className="font-medium">{formatEUR(coutEffectifDraft)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Marge prévisionnelle</p>
          <p className={`font-medium ${margeDraft >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatEUR(margeDraft)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Écart réparation</p>
          <p className={`font-medium ${ecart > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            <MoneyText cents={ecart} />
          </p>
        </div>
        {phone.statut === 'vendu' && (
          <>
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Vendu le</p>
              <p className="font-medium">{phone.dateVente ? formatDateFR(phone.dateVente) : '—'}</p>
            </div>
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Prix de vente</p>
              <p className="font-medium">{phone.prixVente != null ? formatEUR(phone.prixVente) : '—'}</p>
            </div>
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Bénéfice réel</p>
              <p className={`font-medium ${reel != null && reel >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {reel != null ? formatEUR(reel) : '—'}
              </p>
            </div>
          </>
        )}
      </div>

      <h2 className="mb-2 mt-6 text-sm font-medium text-zinc-400">Pièces montées</h2>
      {pieces.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucune pièce montée pour l'instant.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pieces.map((p, i) => {
            const part = parts.find((pt) => pt.id === p.partId)
            return (
              <li key={i}>
                <Link
                  to={`/pieces/${p.partId}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-3 text-sm"
                >
                  <span>
                    {part?.nom ?? 'Pièce supprimée'} × {p.qte}
                  </span>
                  <span className="flex items-center gap-2 text-zinc-400">
                    {formatDateFR(p.date)}
                    <MoneyText cents={p.qte * p.coutUnitaire} />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
