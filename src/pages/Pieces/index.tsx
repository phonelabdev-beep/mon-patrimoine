import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { stockPart, coutUnitaireMoyen } from '@/lib/ledger/stock'
import MoneyText from '@/components/ui/MoneyText'
import EmptyState from '@/components/ui/EmptyState'
import AlertBadge from '@/components/ui/AlertBadge'

export default function Pieces() {
  const parts = useAppStore((s) => s.parts)
  const movements = useAppStore((s) => s.movements)

  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-6">
      <h1 className="mb-4 text-xl font-semibold">Pièces</h1>

      {parts.length === 0 ? (
        <EmptyState title="Aucune pièce" description="Ajoute des pièces via « Achat pièce(s) »." />
      ) : (
        <ul className="flex flex-col gap-2">
          {parts.map((p) => {
            const stock = stockPart(movements, p.id)
            const bas = stock.quantite <= p.seuilAlerte
            return (
              <li key={p.id}>
                <Link
                  to={`/pieces/${p.id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-3"
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
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
