import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import type { Phone, PhoneStatut } from '@/types'
import MoneyText from '@/components/ui/MoneyText'
import EmptyState from '@/components/ui/EmptyState'
import ActionSheet from '@/components/ui/ActionSheet'

const STATUTS: { value: PhoneStatut | 'tous'; label: string }[] = [
  { value: 'tous', label: 'Tous' },
  { value: 'en_stock', label: 'En stock' },
  { value: 'en_reparation', label: 'En réparation' },
  { value: 'en_vente', label: 'En vente' },
  { value: 'vendu', label: 'Vendu' },
]

const BADGE_STYLES: Record<PhoneStatut, string> = {
  en_stock: 'bg-zinc-700 text-zinc-200',
  en_reparation: 'bg-amber-500/20 text-amber-400',
  en_vente: 'bg-indigo-500/20 text-indigo-400',
  vendu: 'bg-emerald-500/20 text-emerald-400',
}

const BADGE_LABELS: Record<PhoneStatut, string> = {
  en_stock: 'En stock',
  en_reparation: 'En réparation',
  en_vente: 'En vente',
  vendu: 'Vendu',
}

export default function Telephones() {
  const navigate = useNavigate()
  const phones = useAppStore((s) => s.phones)
  const supprimerTelephone = useAppStore((s) => s.supprimerTelephone)
  const [filtre, setFiltre] = useState<PhoneStatut | 'tous'>('tous')
  const [phoneActif, setPhoneActif] = useState<Phone | null>(null)

  const filtres = useMemo(
    () => (filtre === 'tous' ? phones : phones.filter((p) => p.statut === filtre)),
    [phones, filtre],
  )

  function handleSupprimer(phone: Phone) {
    const confirme = window.confirm(
      `Supprimer ${phone.modele} ? Tous les mouvements associés seront annulés proprement (rien ne reste orphelin dans le journal). Action irréversible.`,
    )
    if (!confirme) return
    supprimerTelephone(phone.id)
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <h1 className="mb-4 text-xl font-semibold">Téléphones</h1>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {STATUTS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setFiltre(s.value)}
            className={`min-h-[36px] shrink-0 rounded-full px-3 py-1.5 text-sm ${
              filtre === s.value ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {filtres.length === 0 ? (
        <EmptyState title="Aucun téléphone" description="Ajoute ton premier téléphone via le bouton +." />
      ) : (
        <ul className="flex flex-col gap-2">
          {filtres.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setPhoneActif(p)}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-3 text-left"
              >
                <div>
                  <p className="font-medium">{p.modele}</p>
                  <p className="text-sm text-zinc-400">
                    {p.couleur}
                    {p.stockage ? ` · ${p.stockage}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${BADGE_STYLES[p.statut]}`}>{BADGE_LABELS[p.statut]}</span>
                  <p className="mt-1 text-sm text-zinc-300">
                    <MoneyText cents={p.statut === 'vendu' && p.prixVente != null ? p.prixVente : p.prixVenteVise} />
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <ActionSheet
        open={phoneActif != null}
        onClose={() => setPhoneActif(null)}
        title={phoneActif?.modele}
        actions={
          phoneActif
            ? [
                { label: 'Modifier', onClick: () => navigate(`/telephones/${phoneActif.id}`) },
                ...(phoneActif.statut !== 'vendu'
                  ? [{ label: 'Vendre', onClick: () => navigate('/nouveau/vente-telephone', { state: { phoneId: phoneActif.id } }) }]
                  : []),
                { label: 'Supprimer', destructive: true, onClick: () => handleSupprimer(phoneActif) },
              ]
            : []
        }
      />
    </div>
  )
}
