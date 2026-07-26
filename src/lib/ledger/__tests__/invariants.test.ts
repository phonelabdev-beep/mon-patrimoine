import { describe, it, expect } from 'vitest'
import type { Movement } from '@/types'
import {
  achatTelephoneMovement,
  achatPieceMovement,
  utilisationPieceMovement,
  reparationMovement,
  venteTelephoneMovement,
  depenseMovement,
  sommeLignes,
  assertLignesBalanced,
  MovementDesequilibreError,
} from '../movements'
import { patrimoine } from '../patrimoine'
import { stockPart, coutUnitaireMoyen } from '../stock'
import { resultatPeriode } from '../bilan'

const CASH = 'main'
const PHONE_A = 'phone-a'
const PHONE_B = 'phone-b'
const REPAIR_1 = 'repair-1'
const EXPENSE_1 = 'expense-1'
const ECRAN = 'ecran'

/**
 * Séquence réaliste couvrant les 6 opérations : achat téléphone, achat pièces
 * (deux lots, pour vérifier le coût moyen pondéré), utilisation d'une pièce sur
 * un téléphone perso, vente de ce téléphone, achat d'un second téléphone,
 * réparation client (utilisation de pièce + facturation), dépense.
 */
function buildSequence(): Movement[] {
  const movements: Movement[] = []

  movements.push(
    achatTelephoneMovement({
      date: '2026-01-01',
      compteId: CASH,
      montant: 8000,
      libelle: 'Achat iPhone A',
      refId: PHONE_A,
    }),
  )

  movements.push(
    achatPieceMovement({
      date: '2026-01-02',
      compteId: CASH,
      libelle: 'Achat écrans lot 1',
      parts: [{ partId: ECRAN, qte: 3, coutUnitaire: 1500 }],
    }),
  )

  movements.push(
    achatPieceMovement({
      date: '2026-01-03',
      compteId: CASH,
      libelle: 'Achat écrans lot 2',
      parts: [{ partId: ECRAN, qte: 2, coutUnitaire: 1800 }],
    }),
  )

  // Coût moyen pondéré attendu : (3*1500 + 2*1800) / 5 = 1620 (l'exemple du SPEC).
  const coutFigeA = coutUnitaireMoyen(stockPart(movements, ECRAN))
  movements.push(
    utilisationPieceMovement({
      date: '2026-01-04',
      partId: ECRAN,
      qte: 1,
      coutUnitaireFige: coutFigeA,
      destination: 'revente',
      refId: PHONE_A,
      libelle: 'Écran monté sur iPhone A',
    }),
  )

  movements.push(
    venteTelephoneMovement({
      date: '2026-01-05',
      compteId: CASH,
      prixVente: 13000,
      prixAchat: 8000,
      libelle: 'Vente iPhone A',
      refId: PHONE_A,
    }),
  )

  movements.push(
    achatTelephoneMovement({
      date: '2026-01-06',
      compteId: CASH,
      montant: 9500,
      libelle: 'Achat iPhone B',
      refId: PHONE_B,
    }),
  )

  const coutFigeB = coutUnitaireMoyen(stockPart(movements, ECRAN))
  movements.push(
    utilisationPieceMovement({
      date: '2026-01-07',
      partId: ECRAN,
      qte: 1,
      coutUnitaireFige: coutFigeB,
      destination: 'reparation',
      refId: REPAIR_1,
      libelle: 'Écran pour réparation client',
    }),
  )
  movements.push(
    reparationMovement({
      date: '2026-01-07',
      compteId: CASH,
      montant: 4000,
      libelle: 'Réparation client',
      refId: REPAIR_1,
    }),
  )

  movements.push(
    depenseMovement({
      date: '2026-01-08',
      compteId: CASH,
      montant: 500,
      libelle: 'Frais divers',
      refId: EXPENSE_1,
    }),
  )

  return movements
}

describe('invariants du journal', () => {
  it('la somme des lignes de chaque mouvement vaut exactement 0', () => {
    const movements = buildSequence()
    for (const m of movements) {
      expect(sommeLignes(m.lignes)).toBe(0)
    }
  })

  it('le garde-fou de construction rejette un mouvement déséquilibré', () => {
    expect(() =>
      assertLignesBalanced([
        { compte: 'cash:main', montant: -1000 },
        { compte: 'stock:telephones', montant: 900 },
      ]),
    ).toThrow(MovementDesequilibreError)
  })

  it('patrimoine = Σcash + stock:telephones + stock:pieces à chaque étape', () => {
    const movements = buildSequence()
    for (let i = 1; i <= movements.length; i++) {
      const prefixe = movements.slice(0, i)
      const attendu = prefixe
        .flatMap((m) => m.lignes)
        .reduce((s, l) => (l.compte.startsWith('cash:') || l.compte === 'stock:telephones' || l.compte === 'stock:pieces' ? s + l.montant : s), 0)
      expect(patrimoine(prefixe)).toBe(attendu)
    }
  })

  it("une sous-séquence composée uniquement d'achats laisse le patrimoine inchangé", () => {
    const achatsSeuls = buildSequence().filter((m) => m.type === 'achat_telephone' || m.type === 'achat_piece')
    expect(patrimoine(achatsSeuls.slice(0, 0))).toBe(0)
    for (let i = 1; i <= achatsSeuls.length; i++) {
      expect(patrimoine(achatsSeuls.slice(0, i))).toBe(0)
    }
  })

  it('vérifie les valeurs exactes du patrimoine à chaque étape de la séquence mixte', () => {
    const movements = buildSequence()
    const attendus = [
      0, // achat téléphone A (8000) : cash -8000 / stock:tel +8000
      0, // achat écrans lot 1 (4500) : cash -4500 / stock:pieces +4500
      0, // achat écrans lot 2 (3600) : cash -3600 / stock:pieces +3600
      -1620, // utilisation écran sur A (coût figé 1620, revente) : stock:pieces -1620
      3380, // vente A (13000, achat 8000) : +5000 par rapport à l'étape précédente
      3380, // achat téléphone B (9500) : simple conversion cash -> stock
      1760, // utilisation écran sur réparation (coût figé 1620) : stock:pieces -1620
      5760, // réparation facturée 4000 : +4000
      5260, // dépense 500 : -500
    ]
    movements.forEach((_, i) => {
      expect(patrimoine(movements.slice(0, i + 1))).toBe(attendus[i])
    })
  })

  it(
    "patrimoineFinal - patrimoineInitial = bénéfice revente + bénéfice réparation - dépenses, " +
      "où bénéfice revente inclut aussi le coût des pièces montées sur les téléphones du stock perso " +
      '(cf. la décision de conception du SPEC : ce coût est consommé immédiatement, pas capitalisé dans le téléphone)',
    () => {
      const movements = buildSequence()
      const patrimoineInitial = patrimoine([])
      const patrimoineFinal = patrimoine(movements)
      const resultat = resultatPeriode(movements)
      expect(patrimoineFinal - patrimoineInitial).toBe(
        resultat.revente + resultat.reparation - resultat.depenses,
      )
    },
  )

  it("le bénéfice réel d'une vente seule (prixVente - prixAchat) ne suffit pas à expliquer le patrimoine : " +
    "il faut y retrancher le coût des pièces montées avant la vente", () => {
    const movements = buildSequence()
    const beneficeReelVenteSeule = 13000 - 8000 // 5000, tel que défini par Phone.beneficeReel dans le SPEC
    const coutPieceMonteeAvantVente = 1620
    // Le delta patrimoine réellement observé sur le cycle de vie complet du téléphone A
    // (achat -> pose écran -> vente) est le vrai profit économique, pas juste prixVente - prixAchat.
    const deltaReel = patrimoine(movements.slice(0, 5)) - patrimoine(movements.slice(0, 0))
    expect(deltaReel).toBe(beneficeReelVenteSeule - coutPieceMonteeAvantVente)
  })
})
