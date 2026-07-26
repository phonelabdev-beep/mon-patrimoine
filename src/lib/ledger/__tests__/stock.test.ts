import { describe, it, expect } from 'vitest'
import type { Movement } from '@/types'
import {
  achatPieceMovement,
  utilisationPieceMovement,
  ajustementMovement,
  annulerContributionPieceMovement,
  achatTelephoneMovement,
  correctionPrixAchatMovement,
} from '../movements'
import { stockPart, coutUnitaireMoyen, valeurTotaleStockPieces, sortiesPart, sortedByDate } from '../stock'
import { soldeTotalCash } from '../balances'
import { valeurStockTelephones, patrimoine } from '../patrimoine'

const ECRAN = 'ecran'

describe('coût moyen pondéré des pièces', () => {
  it("calcule 16,20€ pour 3 écrans à 15€ puis 2 à 18€ (l'exemple du SPEC)", () => {
    const movements: Movement[] = [
      achatPieceMovement({ date: '2026-01-01', compteId: 'main', libelle: 'lot 1', parts: [{ partId: ECRAN, qte: 3, coutUnitaire: 1500 }] }),
      achatPieceMovement({ date: '2026-01-02', compteId: 'main', libelle: 'lot 2', parts: [{ partId: ECRAN, qte: 2, coutUnitaire: 1800 }] }),
    ]
    const state = stockPart(movements, ECRAN)
    expect(state.quantite).toBe(5)
    expect(state.valeurStock).toBe(3 * 1500 + 2 * 1800)
    expect(coutUnitaireMoyen(state)).toBe(1620)
  })

  it("la consommation d'une pièce ne modifie pas le coût moyen des pièces restantes", () => {
    const movements: Movement[] = [
      achatPieceMovement({ date: '2026-01-01', compteId: 'main', libelle: 'lot 1', parts: [{ partId: ECRAN, qte: 3, coutUnitaire: 1500 }] }),
      achatPieceMovement({ date: '2026-01-02', compteId: 'main', libelle: 'lot 2', parts: [{ partId: ECRAN, qte: 2, coutUnitaire: 1800 }] }),
    ]
    const avgAvant = coutUnitaireMoyen(stockPart(movements, ECRAN))
    movements.push(
      utilisationPieceMovement({
        date: '2026-01-03',
        partId: ECRAN,
        qte: 2,
        coutUnitaireFige: avgAvant,
        destination: 'revente',
        refId: 'phone-x',
        libelle: 'pose',
      }),
    )
    const stateApres = stockPart(movements, ECRAN)
    expect(stateApres.quantite).toBe(3)
    expect(coutUnitaireMoyen(stateApres)).toBe(avgAvant)
  })

  it('rejoue les mouvements par ordre chronologique réel (date), pas par ordre de saisie', () => {
    const m1 = achatPieceMovement({ date: '2026-01-10', compteId: 'main', libelle: 'lot récent', parts: [{ partId: ECRAN, qte: 1, coutUnitaire: 2000 }] })
    const m2 = achatPieceMovement({ date: '2026-01-01', compteId: 'main', libelle: 'lot antidaté', parts: [{ partId: ECRAN, qte: 1, coutUnitaire: 1000 }] })
    // m1 est "créé" avant m2 dans l'ordre du tableau, mais sa date est postérieure :
    // le rejeu doit suivre les dates (01-01 avant 01-10), pas l'ordre du tableau.
    const ordered = sortedByDate([m1, m2])
    expect(ordered.map((m) => m.date)).toEqual(['2026-01-01', '2026-01-10'])
  })

  it('autorise une consommation supérieure au stock (quantité négative), coût moyen à 0 dans ce cas', () => {
    const movements: Movement[] = [
      achatPieceMovement({ date: '2026-01-01', compteId: 'main', libelle: 'lot', parts: [{ partId: ECRAN, qte: 1, coutUnitaire: 1500 }] }),
      utilisationPieceMovement({ date: '2026-01-02', partId: ECRAN, qte: 3, coutUnitaireFige: 1500, destination: 'revente', refId: 'phone-x', libelle: 'pose' }),
    ]
    const state = stockPart(movements, ECRAN)
    expect(state.quantite).toBe(-2)
    expect(coutUnitaireMoyen(state)).toBe(0)
  })

  it('valeurTotaleStockPieces additionne la valeur de toutes les pièces', () => {
    const movements: Movement[] = [
      achatPieceMovement({ date: '2026-01-01', compteId: 'main', libelle: 'écrans', parts: [{ partId: 'ecran', qte: 2, coutUnitaire: 1500 }] }),
      achatPieceMovement({ date: '2026-01-01', compteId: 'main', libelle: 'batteries', parts: [{ partId: 'batterie', qte: 4, coutUnitaire: 800 }] }),
    ]
    expect(valeurTotaleStockPieces(movements)).toBe(2 * 1500 + 4 * 800)
  })

  it("corriger (ajustement) un achat_piece restitue exactement le stock à zéro", () => {
    const achat = achatPieceMovement({ date: '2026-01-01', compteId: 'main', libelle: 'lot', parts: [{ partId: ECRAN, qte: 10, coutUnitaire: 1500 }] })
    const correction = ajustementMovement({ date: '2026-01-02', libelle: 'Correction', original: achat })
    const state = stockPart([achat, correction], ECRAN)
    expect(state.quantite).toBe(0)
    expect(state.valeurStock).toBe(0)
  })

  it("corriger (ajustement) une utilisation_piece restitue la pièce consommée dans le stock", () => {
    const achat = achatPieceMovement({ date: '2026-01-01', compteId: 'main', libelle: 'lot', parts: [{ partId: ECRAN, qte: 5, coutUnitaire: 1500 }] })
    const utilisation = utilisationPieceMovement({
      date: '2026-01-02',
      partId: ECRAN,
      qte: 2,
      coutUnitaireFige: 1500,
      destination: 'revente',
      refId: 'phone-x',
      libelle: 'pose',
    })
    const correction = ajustementMovement({ date: '2026-01-03', libelle: 'Correction', original: utilisation })
    const state = stockPart([achat, utilisation, correction], ECRAN)
    // 5 achetées, 2 consommées puis la consommation annulée : les 2 doivent revenir en stock (5 au total).
    expect(state.quantite).toBe(5)
    expect(state.valeurStock).toBe(5 * 1500)
  })

  it('sortiesPart retourne les sorties triées par date avec leur référence', () => {
    const movements: Movement[] = [
      achatPieceMovement({ date: '2026-01-01', compteId: 'main', libelle: 'lot', parts: [{ partId: ECRAN, qte: 5, coutUnitaire: 1500 }] }),
      utilisationPieceMovement({ date: '2026-01-05', partId: ECRAN, qte: 1, coutUnitaireFige: 1500, destination: 'reparation', refId: 'repair-2', libelle: 'pose 2' }),
      utilisationPieceMovement({ date: '2026-01-03', partId: ECRAN, qte: 1, coutUnitaireFige: 1500, destination: 'revente', refId: 'phone-1', libelle: 'pose 1' }),
    ]
    const sorties = sortiesPart(movements, ECRAN)
    expect(sorties.map((s) => s.refId)).toEqual(['phone-1', 'repair-2'])
  })

  it("annulerContributionPieceMovement n'annule qu'UNE pièce dans un achat groupé, laissant l'autre intacte", () => {
    const BATTERIE = 'batterie'
    const achatGroupe = achatPieceMovement({
      date: '2026-01-01',
      compteId: 'main',
      libelle: 'commande groupée',
      parts: [
        { partId: ECRAN, qte: 3, coutUnitaire: 1500 },
        { partId: BATTERIE, qte: 2, coutUnitaire: 800 },
      ],
    })
    const annulationEcran = annulerContributionPieceMovement({
      date: '2026-01-02',
      libelle: 'Suppression pièce : Écran',
      original: achatGroupe,
      partId: ECRAN,
    })
    const movements = [achatGroupe, annulationEcran]
    expect(stockPart(movements, ECRAN)).toEqual({ quantite: 0, valeurStock: 0 })
    expect(stockPart(movements, BATTERIE)).toEqual({ quantite: 2, valeurStock: 1600 })
    // Le cash n'a été recrédité que de la part de l'écran (3*1500=4500), pas de la commande entière.
    expect(soldeTotalCash(movements)).toBe(-(3 * 1500 + 2 * 800) + 3 * 1500)
  })

  it("annulerContributionPieceMovement restitue le stock quand la pièce provient d'une utilisation_piece", () => {
    const achat = achatPieceMovement({ date: '2026-01-01', compteId: 'main', libelle: 'lot', parts: [{ partId: ECRAN, qte: 5, coutUnitaire: 1500 }] })
    const utilisation = utilisationPieceMovement({
      date: '2026-01-02',
      partId: ECRAN,
      qte: 1,
      coutUnitaireFige: 1500,
      destination: 'revente',
      refId: 'phone-x',
      libelle: 'pose',
    })
    const annulation = annulerContributionPieceMovement({
      date: '2026-01-03',
      libelle: 'Suppression téléphone',
      original: utilisation,
      partId: ECRAN,
    })
    const state = stockPart([achat, utilisation, annulation], ECRAN)
    expect(state.quantite).toBe(5)
    expect(state.valeurStock).toBe(5 * 1500)
  })
})

describe('correctionPrixAchatMovement', () => {
  it("corrige le prix d'achat sans jamais modifier le mouvement achat_telephone d'origine (immuable)", () => {
    const achat = achatTelephoneMovement({ date: '2026-01-01', compteId: 'main', montant: 8000, libelle: 'Achat', refId: 'phone-1' })
    const montantOriginal = achat.lignes.find((l) => l.compte === 'stock:telephones')?.montant
    const correction = correctionPrixAchatMovement({
      date: '2026-01-05',
      compteId: 'main',
      delta: 1000, // corrige 80 -> 90
      libelle: "Correction prix d'achat",
      refId: 'phone-1',
    })
    // Le mouvement d'origine reste inchangé.
    expect(achat.lignes.find((l) => l.compte === 'stock:telephones')?.montant).toBe(montantOriginal)
    const movements = [achat, correction]
    expect(valeurStockTelephones(movements)).toBe(9000)
    expect(soldeTotalCash(movements)).toBe(-9000)
    expect(patrimoine(movements)).toBe(0) // simple conversion cash -> stock, patrimoine inchangé
  })
})
