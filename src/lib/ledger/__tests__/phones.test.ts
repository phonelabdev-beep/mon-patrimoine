import { describe, it, expect } from 'vitest'
import type { Movement, Phone } from '@/types'
import { utilisationPieceMovement } from '../movements'
import { margePrevisionnelle, ecartEstimation, beneficeReel, piecesConsommeesPhone, piecesMonteesSurPhone } from '../phones'

function makePhone(overrides: Partial<Phone> = {}): Phone {
  return {
    id: 'phone-1',
    modele: 'iPhone 12',
    couleur: 'noir',
    dateAchat: '2026-01-01',
    prixAchat: 8000,
    reparationEstimee: 1500,
    prixVenteVise: 13000,
    statut: 'en_stock',
    ...overrides,
  }
}

describe('calculs liés aux téléphones', () => {
  it('margePrevisionnelle = prixVenteVise - prixAchat - reparationEstimee', () => {
    expect(margePrevisionnelle(makePhone())).toBe(13000 - 8000 - 1500)
  })

  it("piecesConsommeesPhone additionne le coût figé de toutes les pièces montées sur ce téléphone", () => {
    const movements: Movement[] = [
      utilisationPieceMovement({ date: '2026-01-02', partId: 'ecran', qte: 1, coutUnitaireFige: 1620, destination: 'revente', refId: 'phone-1', libelle: 'écran' }),
      utilisationPieceMovement({ date: '2026-01-03', partId: 'batterie', qte: 1, coutUnitaireFige: 900, destination: 'revente', refId: 'phone-1', libelle: 'batterie' }),
      utilisationPieceMovement({ date: '2026-01-04', partId: 'ecran', qte: 1, coutUnitaireFige: 1620, destination: 'revente', refId: 'phone-2', libelle: 'écran autre téléphone' }),
    ]
    expect(piecesConsommeesPhone(movements, 'phone-1')).toBe(1620 + 900)
  })

  it('piecesMonteesSurPhone ne retourne que les pièces de ce téléphone, triées par date', () => {
    const movements: Movement[] = [
      utilisationPieceMovement({ date: '2026-01-05', partId: 'batterie', qte: 1, coutUnitaireFige: 900, destination: 'revente', refId: 'phone-1', libelle: 'batterie' }),
      utilisationPieceMovement({ date: '2026-01-02', partId: 'ecran', qte: 1, coutUnitaireFige: 1620, destination: 'revente', refId: 'phone-1', libelle: 'écran' }),
    ]
    const pieces = piecesMonteesSurPhone(movements, 'phone-1')
    expect(pieces.map((p) => p.partId)).toEqual(['ecran', 'batterie'])
  })

  it('ecartEstimation = piecesConsommees - reparationEstimee', () => {
    const phone = makePhone({ reparationEstimee: 1500 })
    const movements: Movement[] = [
      utilisationPieceMovement({ date: '2026-01-02', partId: 'ecran', qte: 1, coutUnitaireFige: 2000, destination: 'revente', refId: phone.id, libelle: 'écran' }),
    ]
    expect(ecartEstimation(movements, phone)).toBe(2000 - 1500)
  })

  it('beneficeReel est null tant que le téléphone n’est pas vendu', () => {
    expect(beneficeReel(makePhone({ statut: 'en_stock' }))).toBeNull()
  })

  it('beneficeReel = prixVente - prixAchat une fois vendu (ne soustrait pas les pièces)', () => {
    const phone = makePhone({ statut: 'vendu', prixVente: 13000, prixAchat: 8000 })
    expect(beneficeReel(phone)).toBe(5000)
  })
})
