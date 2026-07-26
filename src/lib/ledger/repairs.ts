import type { Repair } from '@/types'

/** Marge d'une réparation : prix facturé moins coût des pièces (figé à la création). */
export function margeReparation(repair: Repair): number {
  const coutPieces = repair.piecesUtilisees.reduce((s, p) => s + p.qte * p.coutUnitaireFige, 0)
  return repair.prixFacture - coutPieces
}
