import { describe, it, expect } from 'vitest'
import type { Movement } from '@/types'
import { depenseMovement, reparationMovement, venteTelephoneMovement } from '../movements'
import { resultatParMois, resultatPeriode } from '../bilan'

describe('bilan par période', () => {
  it('regroupe correctement les mouvements par mois, y compris à cheval sur une année', () => {
    const movements: Movement[] = [
      depenseMovement({ date: '2025-12-15', compteId: 'main', montant: 300, libelle: 'décembre', refId: 'e1' }),
      depenseMovement({ date: '2025-12-31', compteId: 'main', montant: 200, libelle: 'décembre bis', refId: 'e2' }),
      depenseMovement({ date: '2026-01-02', compteId: 'main', montant: 100, libelle: 'janvier', refId: 'e3' }),
    ]
    const parMois = resultatParMois(movements)
    expect(parMois.map((b) => b.mois)).toEqual(['2025-12', '2026-01'])
    expect(parMois[0].depenses).toBe(500)
    expect(parMois[1].depenses).toBe(100)
  })

  it('resultatPeriode filtre par bornes de dates incluses', () => {
    const movements: Movement[] = [
      reparationMovement({ date: '2026-01-05', compteId: 'main', montant: 4000, libelle: 'répa 1', refId: 'r1' }),
      reparationMovement({ date: '2026-02-05', compteId: 'main', montant: 6000, libelle: 'répa 2', refId: 'r2' }),
    ]
    const janvier = resultatPeriode(movements, '2026-01-01', '2026-01-31')
    expect(janvier.reparation).toBe(4000)
    const toutesPeriodes = resultatPeriode(movements)
    expect(toutesPeriodes.reparation).toBe(10000)
  })

  it('une vente à perte réduit le bénéfice revente (peut être négatif)', () => {
    const movements: Movement[] = [
      venteTelephoneMovement({ date: '2026-01-01', compteId: 'main', prixVente: 5000, prixAchat: 8000, libelle: 'vente à perte', refId: 'phone-1' }),
    ]
    expect(resultatPeriode(movements).revente).toBe(-3000)
  })
})
