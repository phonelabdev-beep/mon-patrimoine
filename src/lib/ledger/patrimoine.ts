import type { Movement, Phone } from '@/types'
import { soldeTotalCash } from './balances'
import { valeurTotaleStockPieces } from './stock'
import { monthKey } from '../dates'

/** Valeur du stock de téléphones : recalculée depuis les lignes stock:telephones du journal. */
export function valeurStockTelephones(movements: Movement[]): number {
  let total = 0
  for (const m of movements) {
    for (const l of m.lignes) {
      if (l.compte === 'stock:telephones') total += l.montant
    }
  }
  return total
}

/** Patrimoine total = Σ(comptes cash) + stock:telephones + stock:pieces. */
export function patrimoine(movements: Movement[]): number {
  return soldeTotalCash(movements) + valeurStockTelephones(movements) + valeurTotaleStockPieces(movements)
}

/**
 * Valeur de liquidation : cash + Σ prixVenteVise des téléphones pas encore vendus
 * + valeur du stock de pièces. Vision "si je liquide tout maintenant".
 */
export function valeurLiquidation(movements: Movement[], phones: Phone[]): number {
  const cash = soldeTotalCash(movements)
  const valeurTelephonesNonVendus = phones
    .filter((p) => p.statut !== 'vendu')
    .reduce((s, p) => s + p.prixVenteVise, 0)
  const valeurPieces = valeurTotaleStockPieces(movements)
  return cash + valeurTelephonesNonVendus + valeurPieces
}

/** Patrimoine cumulé à la fin de chaque mois ayant au moins un mouvement, trié chronologiquement. */
export function patrimoineParMois(movements: Movement[]): { mois: string; valeur: number }[] {
  const mois = [...new Set(movements.map((m) => monthKey(m.date)))].sort()
  return mois.map((moisCourant) => ({
    mois: moisCourant,
    valeur: patrimoine(movements.filter((m) => monthKey(m.date) <= moisCourant)),
  }))
}
