import { describe, it, expect } from 'vitest'
import type { Repair } from '@/types'
import { margeReparation } from '../repairs'

describe('calculs liés aux réparations', () => {
  it('marge = prixFacture - somme(coûts des pièces)', () => {
    const repair: Repair = {
      id: 'repair-1',
      date: '2026-01-01',
      appareil: "iPhone 12 d'un client",
      piecesUtilisees: [
        { partId: 'ecran', qte: 1, coutUnitaireFige: 1620 },
        { partId: 'batterie', qte: 1, coutUnitaireFige: 900 },
      ],
      prixFacture: 4000,
      compteEncaissement: 'main',
    }
    expect(margeReparation(repair)).toBe(4000 - 1620 - 900)
  })

  it('accepte zéro pièce (main-d’œuvre seule) : marge = prixFacture', () => {
    const repair: Repair = {
      id: 'repair-2',
      date: '2026-01-01',
      appareil: 'Réglage logiciel',
      piecesUtilisees: [],
      prixFacture: 2000,
      compteEncaissement: 'main',
    }
    expect(margeReparation(repair)).toBe(2000)
  })
})
