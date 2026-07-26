import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { todayISO } from '@/lib/dates'
import { parseEURInputToCents } from '@/lib/money'
import { resolveCompteParDefautId } from '@/lib/defaultAccount'
import Field, { inputClass } from '@/components/ui/Field'

type LignePiece = { partId: string; qte: string }

export default function ReparationForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const preselection = location.state as { partId?: string } | null
  const parts = useAppStore((s) => s.parts)
  const creerReparation = useAppStore((s) => s.creerReparation)

  const [date, setDate] = useState(todayISO())
  const [appareil, setAppareil] = useState('')
  const [client, setClient] = useState('')
  const [pieces, setPieces] = useState<LignePiece[]>(preselection?.partId ? [{ partId: preselection.partId, qte: '1' }] : [])
  const [prixFacture, setPrixFacture] = useState('')
  const [notes, setNotes] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  function majPiece(index: number, patch: Partial<LignePiece>) {
    setPieces((ps) => ps.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErreur(null)

    const prixFactureCents = parseEURInputToCents(prixFacture)
    if (!appareil.trim()) return setErreur("L'appareil est obligatoire.")
    if (prixFactureCents == null) return setErreur('Prix facturé invalide.')

    const piecesInput: { partId: string; qte: number }[] = []
    for (const p of pieces) {
      if (!p.partId) continue
      const qte = parseInt(p.qte, 10)
      if (!Number.isFinite(qte) || qte <= 0) return setErreur('Quantité invalide sur une pièce.')
      piecesInput.push({ partId: p.partId, qte })
    }

    try {
      creerReparation({
        date,
        appareil: appareil.trim(),
        client: client.trim() || undefined,
        pieces: piecesInput,
        prixFacture: prixFactureCents,
        compteEncaissement: resolveCompteParDefautId(),
        notes: notes.trim() || undefined,
      })
      navigate('/reparations')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue.')
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <h1 className="mb-4 text-xl font-semibold">Réparation client</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Date *">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Appareil *">
          <input className={inputClass} value={appareil} onChange={(e) => setAppareil(e.target.value)} placeholder="iPhone 12 d'un client" />
        </Field>
        <Field label="Client">
          <input className={inputClass} value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nom (optionnel)" />
        </Field>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-zinc-400">Pièces utilisées (facultatif — main-d'œuvre seule acceptée)</span>
          {pieces.map((p, i) => (
            <div key={i} className="flex gap-2">
              <select className={inputClass} value={p.partId} onChange={(e) => majPiece(i, { partId: e.target.value })}>
                <option value="" disabled>
                  Pièce
                </option>
                {parts.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.nom}
                  </option>
                ))}
              </select>
              <input
                inputMode="numeric"
                className={`${inputClass} w-20 shrink-0`}
                value={p.qte}
                onChange={(e) => majPiece(i, { qte: e.target.value })}
                placeholder="Qté"
              />
              <button
                type="button"
                onClick={() => setPieces((ps) => ps.filter((_, idx) => idx !== i))}
                aria-label="Supprimer"
                className="shrink-0 p-2 text-zinc-400"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPieces((ps) => [...ps, { partId: '', qte: '1' }])}
            className="min-h-[44px] rounded-lg border border-dashed border-zinc-700 text-sm text-indigo-400"
          >
            + Ajouter une pièce
          </button>
        </div>

        <Field label="Prix facturé (€) *">
          <input inputMode="decimal" className={inputClass} value={prixFacture} onChange={(e) => setPrixFacture(e.target.value)} placeholder="40" />
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
