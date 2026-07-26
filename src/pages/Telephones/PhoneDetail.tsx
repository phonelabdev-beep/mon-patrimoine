import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { margePrevisionnelle, ecartEstimation, beneficeReel, piecesMonteesSurPhone } from '@/lib/ledger/phones'
import { formatDateFR } from '@/lib/dates'
import MoneyText from '@/components/ui/MoneyText'
import InfoTile from '@/components/ui/InfoTile'
import EmptyState from '@/components/ui/EmptyState'

export default function PhoneDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const phones = useAppStore((s) => s.phones)
  const parts = useAppStore((s) => s.parts)
  const movements = useAppStore((s) => s.movements)

  const phone = phones.find((p) => p.id === id)

  if (!phone) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6">
        <EmptyState title="Téléphone introuvable" />
      </div>
    )
  }

  const pieces = piecesMonteesSurPhone(movements, phone.id)
  const marge = margePrevisionnelle(phone)
  const ecart = ecartEstimation(movements, phone)
  const reel = beneficeReel(phone)

  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-6">
      <button type="button" onClick={() => navigate(-1)} className="mb-2 text-sm text-zinc-400">
        ← Retour
      </button>
      <h1 className="text-xl font-semibold">{phone.modele}</h1>
      <p className="text-sm text-zinc-400">
        {phone.couleur}
        {phone.stockage ? ` · ${phone.stockage}` : ''}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <InfoTile label="Acheté le" value={formatDateFR(phone.dateAchat)} />
        <InfoTile label="Prix d'achat" value={<MoneyText cents={phone.prixAchat} />} />
        <InfoTile label="Réparation estimée" value={<MoneyText cents={phone.reparationEstimee} />} />
        <InfoTile label="Pièces consommées" value={<MoneyText cents={pieces.reduce((s, p) => s + p.qte * p.coutUnitaire, 0)} />} />
        <InfoTile
          label="Écart estimation"
          value={
            <span className={ecart > 0 ? 'text-red-400' : 'text-emerald-400'}>
              <MoneyText cents={ecart} />
            </span>
          }
        />
        <InfoTile label="Prix de vente visé" value={<MoneyText cents={phone.prixVenteVise} />} />
        <InfoTile
          label="Marge prévisionnelle"
          value={
            <span className={marge >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              <MoneyText cents={marge} />
            </span>
          }
        />
        {phone.statut === 'vendu' && (
          <>
            <InfoTile label="Vendu le" value={phone.dateVente ? formatDateFR(phone.dateVente) : '—'} />
            <InfoTile label="Prix de vente" value={phone.prixVente != null ? <MoneyText cents={phone.prixVente} /> : '—'} />
            <InfoTile
              label="Bénéfice réel"
              value={
                reel != null ? (
                  <span className={reel >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    <MoneyText cents={reel} />
                  </span>
                ) : (
                  '—'
                )
              }
            />
          </>
        )}
      </div>

      {phone.notes && <p className="mt-4 text-sm text-zinc-400">{phone.notes}</p>}

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
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm"
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
