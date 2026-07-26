import type { Movement } from '@/types'
import { monthKey, todayISO } from '../dates'

export type Resultat = {
  revente: number // bénéfice (positif = gain)
  reparation: number // bénéfice (positif = gain)
  depenses: number // montant dépensé (positif = dépensé)
}

/**
 * Un `resultat:X` qui augmente dans un mouvement représente une charge (coût) pour X ;
 * qui diminue représente un gain. Donc bénéfice(X) = -Σ(lignes resultat:X).
 * Pour les dépenses, on affiche directement Σ(resultat:depenses) comme montant dépensé.
 */
function accumulateResultat(movements: Movement[]): Resultat {
  let revente = 0
  let reparation = 0
  let depenses = 0
  for (const m of movements) {
    for (const l of m.lignes) {
      if (l.compte === 'resultat:revente') revente -= l.montant
      else if (l.compte === 'resultat:reparation') reparation -= l.montant
      else if (l.compte === 'resultat:depenses') depenses += l.montant
    }
  }
  return { revente, reparation, depenses }
}

/** Résultat sur une période (bornes ISO incluses, omettre pour ne pas borner). */
export function resultatPeriode(movements: Movement[], dateDebut?: string, dateFin?: string): Resultat {
  const filtered = movements.filter(
    (m) => (!dateDebut || m.date >= dateDebut) && (!dateFin || m.date <= dateFin),
  )
  return accumulateResultat(filtered)
}

export type BilanMensuel = { mois: string } & Resultat

/** Résultat regroupé par mois (YYYY-MM), trié chronologiquement. */
export function resultatParMois(movements: Movement[]): BilanMensuel[] {
  const parMois = new Map<string, Movement[]>()
  for (const m of movements) {
    const key = monthKey(m.date)
    const arr = parMois.get(key)
    if (arr) arr.push(m)
    else parMois.set(key, [m])
  }
  return [...parMois.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([mois, mvts]) => ({ mois, ...accumulateResultat(mvts) }))
}

/** Résultat du mois en cours. */
export function resultatMoisCourant(movements: Movement[]): Resultat {
  const key = monthKey(todayISO())
  return resultatPeriode(movements, `${key}-01`, `${key}-31`)
}
