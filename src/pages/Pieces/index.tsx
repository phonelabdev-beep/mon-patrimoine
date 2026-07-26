import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import type { Part } from '@/types'
import { stockPart, coutUnitaireMoyen } from '@/lib/ledger/stock'
import MoneyText from '@/components/ui/MoneyText'
import EmptyState from '@/components/ui/EmptyState'
import AlertBadge from '@/components/ui/AlertBadge'
import ActionSheet from '@/components/ui/ActionSheet'
import Sheet from '@/components/ui/Sheet'

export default function Pieces() {
  const navigate = useNavigate()
  const parts = useAppStore((s) => s.parts)
  const movements = useAppStore((s) => s.movements)
  const supprimerPiece = useAppStore((s) => s.supprimerPiece)

  const [categorieFiltre, setCategorieFiltre] = useState<string>('toutes')
  const [pieceActive, setPieceActive] = useState<Part | null>(null)
  const [partIdPourUtiliser, setPartIdPourUtiliser] = useState<string | null>(null)

  const categories = useMemo(() => [...new Set(parts.map((p) => p.categorie))].sort(), [parts])

  const filtres = useMemo(
    () => (categorieFiltre === 'toutes' ? parts : parts.filter((p) => p.categorie === categorieFiltre)),
    [parts, categorieFiltre],
  )

  const groupes = useMemo(() => {
    const map = new Map<string, Part[]>()
    for (const p of filtres) {
      const arr = map.get(p.categorie)
      if (arr) arr.push(p)
      else map.set(p.categorie, [p])
    }
    return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1))
  }, [filtres])

  function handleSupprimer(part: Part) {
    const confirme = window.confirm(
      `Supprimer ${part.nom} ? Tous les mouvements associés seront annulés proprement (rien ne reste orphelin dans le journal). Action irréversible.`,
    )
    if (!confirme) return
    supprimerPiece(part.id)
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <h1 className="mb-4 text-xl font-semibold">Pièces</h1>

      {parts.length === 0 ? (
        <EmptyState title="Aucune pièce" description="Ajoute des pièces via « Achat pièce(s) »." />
      ) : (
        <>
          {categories.length > 1 && (
            <div className="mb-4 flex gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setCategorieFiltre('toutes')}
                className={`min-h-[36px] shrink-0 rounded-full px-3 py-1.5 text-sm ${
                  categorieFiltre === 'toutes' ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                Toutes
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategorieFiltre(c)}
                  className={`min-h-[36px] shrink-0 rounded-full px-3 py-1.5 text-sm capitalize ${
                    categorieFiltre === c ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {groupes.map(([categorie, list]) => (
            <div key={categorie} className="mb-4">
              {categorieFiltre === 'toutes' && categories.length > 1 && (
                <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">{categorie}</h2>
              )}
              <ul className="flex flex-col gap-2">
                {list.map((p) => {
                  const stock = stockPart(movements, p.id)
                  const bas = stock.quantite <= p.seuilAlerte
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setPieceActive(p)}
                        className="flex w-full items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-3 text-left"
                      >
                        <div>
                          <p className="font-medium">{p.nom}</p>
                          <p className="text-sm text-zinc-400">{p.categorie}</p>
                        </div>
                        <div className="text-right">
                          {bas ? (
                            <AlertBadge>{stock.quantite} en stock</AlertBadge>
                          ) : (
                            <p className="text-sm text-zinc-300">{stock.quantite} en stock</p>
                          )}
                          <p className="text-sm text-zinc-400">
                            <MoneyText cents={stock.valeurStock} /> · <MoneyText cents={coutUnitaireMoyen(stock)} />
                            /u
                          </p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </>
      )}

      <ActionSheet
        open={pieceActive != null}
        onClose={() => setPieceActive(null)}
        title={pieceActive?.nom}
        actions={
          pieceActive
            ? [
                { label: 'Modifier', onClick: () => navigate(`/pieces/${pieceActive.id}`) },
                { label: 'Utiliser', onClick: () => setPartIdPourUtiliser(pieceActive.id) },
                { label: 'Supprimer', destructive: true, onClick: () => handleSupprimer(pieceActive) },
              ]
            : []
        }
      />

      <Sheet open={partIdPourUtiliser != null} onClose={() => setPartIdPourUtiliser(null)} title="Utiliser sur…">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              const partId = partIdPourUtiliser
              setPartIdPourUtiliser(null)
              navigate('/nouveau/utilisation-piece', { state: { partId } })
            }}
            className="min-h-[44px] rounded-lg border border-zinc-700 bg-zinc-800 px-4 text-left font-medium text-zinc-100"
          >
            Un de mes téléphones
          </button>
          <button
            type="button"
            onClick={() => {
              const partId = partIdPourUtiliser
              setPartIdPourUtiliser(null)
              navigate('/nouveau/reparation', { state: { partId } })
            }}
            className="min-h-[44px] rounded-lg border border-zinc-700 bg-zinc-800 px-4 text-left font-medium text-zinc-100"
          >
            Une réparation client
          </button>
        </div>
      </Sheet>
    </div>
  )
}
