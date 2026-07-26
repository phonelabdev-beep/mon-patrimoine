import type { Movement } from '@/types'

const CASH_PREFIX = 'cash:'

/** Solde d'un compte cash donné, recalculé depuis le journal. */
export function soldeCompte(movements: Movement[], compteId: string): number {
  const compte = `${CASH_PREFIX}${compteId}`
  let solde = 0
  for (const m of movements) {
    for (const l of m.lignes) {
      if (l.compte === compte) solde += l.montant
    }
  }
  return solde
}

/** Soldes de tous les comptes cash connus, recalculés depuis le journal. */
export function soldesTousComptes(movements: Movement[], compteIds: string[]): Record<string, number> {
  const soldes: Record<string, number> = {}
  for (const id of compteIds) soldes[id] = 0
  for (const m of movements) {
    for (const l of m.lignes) {
      if (l.compte.startsWith(CASH_PREFIX)) {
        const id = l.compte.slice(CASH_PREFIX.length)
        soldes[id] = (soldes[id] ?? 0) + l.montant
      }
    }
  }
  return soldes
}

/** Somme de tous les comptes cash, tous comptes confondus. */
export function soldeTotalCash(movements: Movement[]): number {
  let total = 0
  for (const m of movements) {
    for (const l of m.lignes) {
      if (l.compte.startsWith(CASH_PREFIX)) total += l.montant
    }
  }
  return total
}
