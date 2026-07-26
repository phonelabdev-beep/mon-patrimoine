import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import type { Part } from '@/types'
import { stockPart, coutUnitaireMoyen, sortiesPart } from '@/lib/ledger/stock'
import { formatDateFR } from '@/lib/dates'
import { CATEGORIES_PIECES_SUGGEREES } from '@/lib/partCategories'
import MoneyText from '@/components/ui/MoneyText'
import InfoTile from '@/components/ui/InfoTile'
import EmptyState from '@/components/ui/EmptyState'
import Field, { inputClass } from '@/components/ui/Field'

type Draft = {
  nom: string
  categorie: string
  fournisseur: string
  seuilAlerte: string
}

function toDraft(p: Part): Draft {
  return {
    nom: p.nom,
    categorie: p.categorie,
    fournisseur: p.fournisseur ?? '',
    seuilAlerte: String(p.seuilAlerte),
  }
}

export default function PartDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const parts = useAppStore((s) => s.parts)
  const phones = useAppStore((s) => s.phones)
  const repairs = useAppStore((s) => s.repairs)
  const movements = useAppStore((s) => s.movements)
  const modifierPiece = useAppStore((s) => s.modifierPiece)
  const supprimerPiece = useAppStore((s) => s.supprimerPiece)

  const part = parts.find((p) => p.id === id)
  const [draft, setDraft] = useState<Draft | null>(part ? toDraft(part) : null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (part) setDraft(toDraft(part))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part?.id])

  if (!part || !draft) {
    return (
      <div className="mx-auto max-w-md px-4">
        <EmptyState title="Pièce introuvable" />
      </div>
    )
  }

  const stock = stockPart(movements, part.id)
  const sorties = sortiesPart(movements, part.id)

  function handleEnregistrer() {
    setErreur(null)
    setMessage(null)
    const seuil = parseInt(draft!.seuilAlerte, 10)
    if (!draft!.nom.trim() || !draft!.categorie.trim()) return setErreur('Nom et catégorie sont obligatoires.')
    if (!Number.isFinite(seuil) || seuil < 0) return setErreur("Seuil d'alerte invalide.")
    modifierPiece(part!.id, {
      nom: draft!.nom.trim(),
      categorie: draft!.categorie.trim(),
      fournisseur: draft!.fournisseur.trim() || undefined,
      seuilAlerte: seuil,
    })
    setMessage('Modifications enregistrées.')
  }

  function handleSupprimer() {
    const confirme = window.confirm(
      `Supprimer ${part!.nom} ? Tous les mouvements associés seront annulés proprement. Action irréversible.`,
    )
    if (!confirme) return
    supprimerPiece(part!.id)
    navigate('/pieces')
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <button type="button" onClick={() => navigate(-1)} className="mb-2 text-sm text-zinc-400">
        ← Retour
      </button>

      <button
        type="button"
        onClick={handleSupprimer}
        className="mb-4 min-h-[44px] w-full rounded-lg border border-red-900/50 bg-red-950/30 font-medium text-red-400"
      >
        Supprimer
      </button>

      <div className="flex flex-col gap-4">
        <Field label="Nom *">
          <input className={inputClass} value={draft.nom} onChange={(e) => setDraft({ ...draft, nom: e.target.value })} />
        </Field>
        <Field label="Catégorie *">
          <input
            className={inputClass}
            list="categories-pieces"
            value={draft.categorie}
            onChange={(e) => setDraft({ ...draft, categorie: e.target.value })}
          />
          <datalist id="categories-pieces">
            {CATEGORIES_PIECES_SUGGEREES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Fournisseur">
          <input className={inputClass} value={draft.fournisseur} onChange={(e) => setDraft({ ...draft, fournisseur: e.target.value })} />
        </Field>
        <Field label="Seuil d'alerte stock">
          <input
            inputMode="numeric"
            className={inputClass}
            value={draft.seuilAlerte}
            onChange={(e) => setDraft({ ...draft, seuilAlerte: e.target.value })}
          />
        </Field>

        {erreur && <p className="text-sm text-red-400">{erreur}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        <button type="button" onClick={handleEnregistrer} className="min-h-[44px] rounded-lg bg-indigo-500 font-medium text-white">
          Enregistrer les modifications
        </button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 text-sm">
        <InfoTile label="En stock" value={String(stock.quantite)} />
        <InfoTile label="Coût moyen" value={<MoneyText cents={coutUnitaireMoyen(stock)} />} />
        <InfoTile label="Valeur stock" value={<MoneyText cents={stock.valeurStock} />} />
      </div>
      {stock.quantite <= part.seuilAlerte && (
        <p className="mt-2 text-sm text-amber-400">Stock bas (seuil d'alerte : {part.seuilAlerte})</p>
      )}

      <h2 className="mb-2 mt-6 text-sm font-medium text-zinc-400">Historique des sorties</h2>
      {sorties.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucune sortie pour l'instant.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorties.map((s) => {
            const phone = phones.find((p) => p.id === s.refId)
            const repair = repairs.find((r) => r.id === s.refId)
            const to = phone ? `/telephones/${phone.id}` : repair ? '/reparations' : undefined
            const label = phone ? `${phone.modele} (perso)` : repair ? `Réparation : ${repair.appareil}` : 'Inconnu'
            const contenu = (
              <>
                <span>
                  {label} × {s.qte}
                </span>
                <span className="flex items-center gap-2 text-zinc-400">
                  {formatDateFR(s.date)}
                  <MoneyText cents={s.qte * s.coutUnitaire} />
                </span>
              </>
            )
            return (
              <li key={s.movementId}>
                {to ? (
                  <Link to={to} className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-3 text-sm">
                    {contenu}
                  </Link>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-3 text-sm">{contenu}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
