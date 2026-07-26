import { describe, it, expect } from 'vitest'
import type { Movement } from '@/types'
import { achatTelephoneMovement, venteTelephoneMovement, depenseMovement, soldeInitialMovement } from '../movements'
import { patrimoineParMois, patrimoine } from '../patrimoine'
import { resultatPeriode } from '../bilan'

describe('patrimoineParMois', () => {
  it('calcule le patrimoine cumulé mois par mois, triés chronologiquement', () => {
    const movements: Movement[] = [
      achatTelephoneMovement({ date: '2026-01-15', compteId: 'main', montant: 8000, libelle: 'Achat', refId: 'p1' }),
      venteTelephoneMovement({ date: '2026-02-10', compteId: 'main', prixVente: 13000, prixAchat: 8000, libelle: 'Vente', refId: 'p1' }),
      depenseMovement({ date: '2026-03-05', compteId: 'main', montant: 500, libelle: 'Frais', refId: 'e1' }),
    ]
    const parMois = patrimoineParMois(movements)
    expect(parMois.map((p) => p.mois)).toEqual(['2026-01', '2026-02', '2026-03'])
    expect(parMois[0].valeur).toBe(0) // achat seul : patrimoine inchangé
    expect(parMois[1].valeur).toBe(5000) // + marge de la vente
    expect(parMois[2].valeur).toBe(4500) // - dépense
  })

  it('retourne un tableau vide sans mouvement', () => {
    expect(patrimoineParMois([])).toEqual([])
  })
})

describe('soldeInitialMovement', () => {
  it("augmente le patrimoine d'exactement le montant, sans jamais toucher au bénéfice", () => {
    const movement = soldeInitialMovement({ date: '2026-01-01', compteId: 'main', montant: 20000, libelle: 'Solde de départ' })
    expect(patrimoine([movement])).toBe(20000)
    const resultat = resultatPeriode([movement])
    expect(resultat.revente).toBe(0)
    expect(resultat.reparation).toBe(0)
    expect(resultat.depenses).toBe(0)
  })
})
