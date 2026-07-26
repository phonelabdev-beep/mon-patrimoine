import type { Movement, Phone } from '@/types'

export type PieceMontee = {
  partId: string
  qte: number
  coutUnitaire: number
  date: string
  movementId: string
}

/** Historique des pièces montées sur un téléphone, triées par date. */
export function piecesMonteesSurPhone(movements: Movement[], phoneId: string): PieceMontee[] {
  const pieces: PieceMontee[] = []
  for (const m of movements) {
    if (m.type !== 'utilisation_piece' || m.refId !== phoneId) continue
    for (const p of m.meta?.parts ?? []) {
      pieces.push({ ...p, date: m.date, movementId: m.id })
    }
  }
  return pieces.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/** Coût total des pièces réellement montées sur ce téléphone (depuis le journal). */
export function piecesConsommeesPhone(movements: Movement[], phoneId: string): number {
  return piecesMonteesSurPhone(movements, phoneId).reduce((s, p) => s + p.qte * p.coutUnitaire, 0)
}

/** Marge prévisionnelle : objectif de vente moins prix d'achat moins réparation estimée. */
export function margePrevisionnelle(phone: Phone): number {
  return phone.prixVenteVise - phone.prixAchat - phone.reparationEstimee
}

/** Écart entre les pièces réellement consommées et l'estimation initiale. */
export function ecartEstimation(movements: Movement[], phone: Phone): number {
  return piecesConsommeesPhone(movements, phone.id) - phone.reparationEstimee
}

/** Bénéfice réel une fois le téléphone vendu (null tant qu'il ne l'est pas). */
export function beneficeReel(phone: Phone): number | null {
  if (phone.statut !== 'vendu' || phone.prixVente == null) return null
  return phone.prixVente - phone.prixAchat
}
