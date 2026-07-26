import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { stockPart, coutUnitaireMoyen, sortiesPart } from '@/lib/ledger/stock'
import { formatDateFR } from '@/lib/dates'
import MoneyText from '@/components/ui/MoneyText'
import InfoTile from '@/components/ui/InfoTile'
import EmptyState from '@/components/ui/EmptyState'

export default function PartDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const parts = useAppStore((s) => s.parts)
  const phones = useAppStore((s) => s.phones)
  const repairs = useAppStore((s) => s.repairs)
  const movements = useAppStore((s) => s.movements)

  const part = parts.find((p) => p.id === id)

  if (!part) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6">
        <EmptyState title="Pièce introuvable" />
      </div>
    )
  }

  const stock = stockPart(movements, part.id)
  const sorties = sortiesPart(movements, part.id)

  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-6">
      <button type="button" onClick={() => navigate(-1)} className="mb-2 text-sm text-zinc-400">
        ← Retour
      </button>
      <h1 className="text-xl font-semibold">{part.nom}</h1>
      <p className="text-sm text-zinc-400">
        {part.categorie}
        {part.fournisseur ? ` · ${part.fournisseur}` : ''}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
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
                  <Link to={to} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm">
                    {contenu}
                  </Link>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm">{contenu}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
