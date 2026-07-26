import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { todayISO } from '@/lib/dates'
import { parseEURInputToCents } from '@/lib/money'
import { resolveCompteParDefautId } from '@/lib/defaultAccount'
import { CATEGORIES_PIECES_SUGGEREES } from '@/lib/partCategories'
import Field, { inputClass } from '@/components/ui/Field'

type Ligne = {
  mode: 'existante' | 'nouvelle'
  partId: string
  nom: string
  categorie: string
  fournisseur: string
  seuilAlerte: string
  qte: string
  prixUnitaire: string
}

function ligneVide(): Ligne {
  return { mode: 'existante', partId: '', nom: '', categorie: '', fournisseur: '', seuilAlerte: '', qte: '', prixUnitaire: '' }
}

export default function AchatPiecesForm() {
  const navigate = useNavigate()
  const parts = useAppStore((s) => s.parts)
  const achatPieces = useAppStore((s) => s.achatPieces)

  const [date, setDate] = useState(todayISO())
  const [libelle, setLibelle] = useState('')
  const [lignes, setLignes] = useState<Ligne[]>([ligneVide()])
  const [erreur, setErreur] = useState<string | null>(null)

  function majLigne(index: number, patch: Partial<Ligne>) {
    setLignes((ls) => ls.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  function supprimerLigne(index: number) {
    setLignes((ls) => ls.filter((_, i) => i !== index))
  }

  function trouverPieceSimilaire(nom: string) {
    const nomNormalise = nom.trim().toLowerCase()
    if (!nomNormalise) return undefined
    return parts.find((p) => p.nom.trim().toLowerCase() === nomNormalise)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErreur(null)
    if (lignes.length === 0) return setErreur('Ajoute au moins une ligne.')

    const lignesInput = []
    for (const l of lignes) {
      const qte = parseInt(l.qte, 10)
      const prixUnitaireCents = parseEURInputToCents(l.prixUnitaire)
      if (!Number.isFinite(qte) || qte <= 0) return setErreur('Quantité invalide sur une ligne.')
      if (prixUnitaireCents == null) return setErreur('Prix unitaire invalide sur une ligne.')
      if (l.mode === 'existante') {
        if (!l.partId) return setErreur('Choisis une pièce existante ou passe en "nouvelle pièce".')
        lignesInput.push({ partId: l.partId, qte, prixUnitaire: prixUnitaireCents })
      } else {
        if (!l.nom.trim() || !l.categorie.trim()) return setErreur('Nom et catégorie sont obligatoires pour une nouvelle pièce.')
        const seuilAlerte = parseInt(l.seuilAlerte, 10)
        lignesInput.push({
          nouvellePart: {
            nom: l.nom.trim(),
            categorie: l.categorie.trim(),
            compatibilite: [],
            fournisseur: l.fournisseur.trim() || undefined,
            seuilAlerte: Number.isFinite(seuilAlerte) && seuilAlerte >= 0 ? seuilAlerte : 0,
          },
          qte,
          prixUnitaire: prixUnitaireCents,
        })
      }
    }

    try {
      achatPieces({ date, compteId: resolveCompteParDefautId(), libelle: libelle.trim() || 'Achat de pièces', lignes: lignesInput })
      navigate('/pieces')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue.')
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <h1 className="mb-4 text-xl font-semibold">Achat pièce(s)</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Date *">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Libellé">
          <input className={inputClass} value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Commande écrans iPhone" />
        </Field>

        <div className="flex flex-col gap-3">
          {lignes.map((l, i) => {
            const similaire = l.mode === 'nouvelle' ? trouverPieceSimilaire(l.nom) : undefined
            return (
              <div key={i} className="flex flex-col gap-2 rounded-lg border border-zinc-700 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => majLigne(i, { mode: 'existante' })}
                      className={`rounded-full px-3 py-1 ${l.mode === 'existante' ? 'bg-indigo-500 text-white' : 'text-zinc-400'}`}
                    >
                      Pièce existante
                    </button>
                    <button
                      type="button"
                      onClick={() => majLigne(i, { mode: 'nouvelle' })}
                      className={`rounded-full px-3 py-1 ${l.mode === 'nouvelle' ? 'bg-indigo-500 text-white' : 'text-zinc-400'}`}
                    >
                      Nouvelle pièce
                    </button>
                  </div>
                  {lignes.length > 1 && (
                    <button type="button" onClick={() => supprimerLigne(i)} aria-label="Supprimer la ligne" className="p-2 text-zinc-400">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                {l.mode === 'existante' ? (
                  <select className={inputClass} value={l.partId} onChange={(e) => majLigne(i, { partId: e.target.value })}>
                    <option value="" disabled>
                      Choisir une pièce
                    </option>
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      className={inputClass}
                      list="pieces-existantes"
                      value={l.nom}
                      onChange={(e) => majLigne(i, { nom: e.target.value })}
                      placeholder="Nom (ex : Écran iPhone 11 OLED)"
                    />
                    {similaire && (
                      <button
                        type="button"
                        onClick={() => majLigne(i, { mode: 'existante', partId: similaire.id })}
                        className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-left text-xs text-amber-400"
                      >
                        Une pièce « {similaire.nom} » existe déjà — utiliser celle-ci à la place ?
                      </button>
                    )}
                    <input
                      className={inputClass}
                      list="categories-pieces"
                      value={l.categorie}
                      onChange={(e) => majLigne(i, { categorie: e.target.value })}
                      placeholder="Catégorie (écran, batterie…)"
                    />
                    <input className={inputClass} value={l.fournisseur} onChange={(e) => majLigne(i, { fournisseur: e.target.value })} placeholder="Fournisseur (optionnel)" />
                    <input inputMode="numeric" className={inputClass} value={l.seuilAlerte} onChange={(e) => majLigne(i, { seuilAlerte: e.target.value })} placeholder="Seuil d'alerte stock (ex : 2)" />
                  </div>
                )}

                <div className="flex gap-2">
                  <input inputMode="numeric" className={inputClass} value={l.qte} onChange={(e) => majLigne(i, { qte: e.target.value })} placeholder="Quantité" />
                  <input inputMode="decimal" className={inputClass} value={l.prixUnitaire} onChange={(e) => majLigne(i, { prixUnitaire: e.target.value })} placeholder="Prix unitaire (€)" />
                </div>
              </div>
            )
          })}
        </div>

        <datalist id="pieces-existantes">
          {parts.map((p) => (
            <option key={p.id} value={p.nom} />
          ))}
        </datalist>
        <datalist id="categories-pieces">
          {CATEGORIES_PIECES_SUGGEREES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <button
          type="button"
          onClick={() => setLignes((ls) => [...ls, ligneVide()])}
          className="min-h-[44px] rounded-lg border border-dashed border-zinc-700 text-sm text-indigo-400"
        >
          + Ajouter une ligne
        </button>

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
