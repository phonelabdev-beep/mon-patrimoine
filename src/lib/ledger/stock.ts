import type { Movement } from '@/types'

export type PartStockState = {
  quantite: number
  valeurStock: number // centimes
}

/** Trie les mouvements par ordre chronologique réel (date, puis createdAt en cas d'égalité). */
export function sortedByDate(movements: Movement[]): Movement[] {
  return [...movements].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1
    return 0
  })
}

/**
 * Rejoue le journal pour calculer, par pièce, la quantité en stock et la valeur
 * en stock (méthode du coût moyen pondéré). Le coût unitaire figé au moment de
 * chaque `utilisation_piece` est déjà gravé dans `meta.parts` : le rejeu ne fait
 * que retrancher quantité/valeur dans les mêmes proportions, sans cas particulier.
 *
 * Le sens (ajout ou retrait de stock) est déduit du signe de la ligne
 * `stock:pieces` du mouvement lui-même, pas de son `type` : un `ajustement`
 * qui annule un `achat_piece` ou un `utilisation_piece` porte le même
 * `meta.parts` que le mouvement d'origine (voir `ajustementMovement`), avec une
 * ligne `stock:pieces` de signe opposé — il s'intègre donc naturellement au
 * rejeu sans traitement spécial, et une correction annule bien son effet sur le
 * stock, pas seulement sur le cash/résultat.
 */
export function calculerStockPieces(movements: Movement[]): Map<string, PartStockState> {
  const state = new Map<string, PartStockState>()
  for (const m of sortedByDate(movements)) {
    const parts = m.meta?.parts
    if (!parts || parts.length === 0) continue
    const ligneStockPieces = m.lignes.find((l) => l.compte === 'stock:pieces')
    if (!ligneStockPieces) continue
    const signe = ligneStockPieces.montant >= 0 ? 1 : -1
    for (const p of parts) {
      const current = state.get(p.partId) ?? { quantite: 0, valeurStock: 0 }
      current.quantite += signe * p.qte
      current.valeurStock += signe * p.qte * p.coutUnitaire
      state.set(p.partId, current)
    }
  }
  return state
}

export function stockPart(movements: Movement[], partId: string): PartStockState {
  return calculerStockPieces(movements).get(partId) ?? { quantite: 0, valeurStock: 0 }
}

/** Coût unitaire moyen pondéré courant d'une pièce (0 si aucun stock). */
export function coutUnitaireMoyen(state: PartStockState): number {
  if (state.quantite <= 0) return 0
  return Math.round(state.valeurStock / state.quantite)
}

/** Valeur totale du stock de pièces, toutes pièces confondues. */
export function valeurTotaleStockPieces(movements: Movement[]): number {
  let total = 0
  for (const state of calculerStockPieces(movements).values()) total += state.valeurStock
  return total
}

export type SortiePart = {
  qte: number
  coutUnitaire: number
  date: string
  movementId: string
  refId?: string
}

/** Historique des sorties d'une pièce (vers quel téléphone / quelle réparation), triées par date. */
export function sortiesPart(movements: Movement[], partId: string): SortiePart[] {
  const sorties: SortiePart[] = []
  for (const m of movements) {
    if (m.type !== 'utilisation_piece') continue
    const part = m.meta?.parts?.find((p) => p.partId === partId)
    if (!part) continue
    sorties.push({ qte: part.qte, coutUnitaire: part.coutUnitaire, date: m.date, movementId: m.id, refId: m.refId })
  }
  return sorties.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}
