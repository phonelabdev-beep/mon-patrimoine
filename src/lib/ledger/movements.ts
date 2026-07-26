import type { Movement, MovementLigne, MovementType, MovementPartMeta } from '@/types'
import { newId } from '../id'

export class MovementDesequilibreError extends Error {
  constructor(sum: number) {
    super(`Mouvement déséquilibré : la somme des lignes vaut ${sum} centimes, attendu 0.`)
    this.name = 'MovementDesequilibreError'
  }
}

export function sommeLignes(lignes: MovementLigne[]): number {
  return lignes.reduce((s, l) => s + l.montant, 0)
}

export function assertLignesBalanced(lignes: MovementLigne[]) {
  const sum = sommeLignes(lignes)
  if (sum !== 0) throw new MovementDesequilibreError(sum)
}

type BuildMovementInput = {
  date: string
  type: MovementType
  libelle: string
  lignes: MovementLigne[]
  refId?: string
  meta?: Movement['meta']
}

function buildMovement(input: BuildMovementInput): Movement {
  assertLignesBalanced(input.lignes)
  return {
    id: newId(),
    date: input.date,
    type: input.type,
    libelle: input.libelle,
    lignes: input.lignes,
    refId: input.refId,
    meta: input.meta,
    createdAt: new Date().toISOString(),
  }
}

export function achatTelephoneMovement(input: {
  date: string
  compteId: string
  montant: number
  libelle: string
  refId: string
}): Movement {
  return buildMovement({
    date: input.date,
    type: 'achat_telephone',
    libelle: input.libelle,
    refId: input.refId,
    lignes: [
      { compte: `cash:${input.compteId}`, montant: -input.montant },
      { compte: 'stock:telephones', montant: input.montant },
    ],
  })
}

export function achatPieceMovement(input: {
  date: string
  compteId: string
  libelle: string
  parts: MovementPartMeta[]
}): Movement {
  const total = input.parts.reduce((s, p) => s + p.qte * p.coutUnitaire, 0)
  return buildMovement({
    date: input.date,
    type: 'achat_piece',
    libelle: input.libelle,
    meta: { parts: input.parts },
    lignes: [
      { compte: `cash:${input.compteId}`, montant: -total },
      { compte: 'stock:pieces', montant: total },
    ],
  })
}

export function utilisationPieceMovement(input: {
  date: string
  partId: string
  qte: number
  coutUnitaireFige: number
  destination: 'revente' | 'reparation'
  refId: string
  libelle: string
}): Movement {
  const montant = input.qte * input.coutUnitaireFige
  const resultatCompte = input.destination === 'revente' ? 'resultat:revente' : 'resultat:reparation'
  return buildMovement({
    date: input.date,
    type: 'utilisation_piece',
    libelle: input.libelle,
    refId: input.refId,
    meta: { parts: [{ partId: input.partId, qte: input.qte, coutUnitaire: input.coutUnitaireFige }] },
    lignes: [
      { compte: 'stock:pieces', montant: -montant },
      { compte: resultatCompte, montant },
    ],
  })
}

export function reparationMovement(input: {
  date: string
  compteId: string
  montant: number
  libelle: string
  refId: string
}): Movement {
  return buildMovement({
    date: input.date,
    type: 'reparation',
    libelle: input.libelle,
    refId: input.refId,
    lignes: [
      { compte: `cash:${input.compteId}`, montant: input.montant },
      { compte: 'resultat:reparation', montant: -input.montant },
    ],
  })
}

export function venteTelephoneMovement(input: {
  date: string
  compteId: string
  prixVente: number
  prixAchat: number
  libelle: string
  refId: string
}): Movement {
  return buildMovement({
    date: input.date,
    type: 'vente_telephone',
    libelle: input.libelle,
    refId: input.refId,
    lignes: [
      { compte: `cash:${input.compteId}`, montant: input.prixVente },
      { compte: 'stock:telephones', montant: -input.prixAchat },
      { compte: 'resultat:revente', montant: -(input.prixVente - input.prixAchat) },
    ],
  })
}

export function depenseMovement(input: {
  date: string
  compteId: string
  montant: number
  libelle: string
  refId: string
}): Movement {
  return buildMovement({
    date: input.date,
    type: 'depense',
    libelle: input.libelle,
    refId: input.refId,
    lignes: [
      { compte: `cash:${input.compteId}`, montant: -input.montant },
      { compte: 'resultat:depenses', montant: input.montant },
    ],
  })
}

/**
 * Solde de départ / apport : injecte de l'argent déjà possédé par l'utilisateur
 * dans un compte cash. La contrepartie `capital:apport` n'entre dans aucun calcul
 * de patrimoine ni de bénéfice (voir `types/index.ts`) — seul le patrimoine total
 * augmente, comme un dépôt, pas un gain.
 */
export function soldeInitialMovement(input: {
  date: string
  compteId: string
  montant: number
  libelle: string
}): Movement {
  return buildMovement({
    date: input.date,
    type: 'solde_initial',
    libelle: input.libelle,
    lignes: [
      { compte: `cash:${input.compteId}`, montant: input.montant },
      { compte: 'capital:apport', montant: -input.montant },
    ],
  })
}

/**
 * Correction du prix d'achat d'un téléphone NON encore vendu : ajuste cash et
 * stock:telephones du delta (nouveau - ancien), sans jamais toucher au
 * mouvement `achat_telephone` d'origine (immuable). Une fois le téléphone
 * vendu, ce champ n'est plus modifiable (voir `store/useAppStore.ts`).
 */
export function correctionPrixAchatMovement(input: {
  date: string
  compteId: string
  delta: number // nouveau prixAchat - ancien prixAchat
  libelle: string
  refId: string
}): Movement {
  return buildMovement({
    date: input.date,
    type: 'ajustement',
    libelle: input.libelle,
    refId: input.refId,
    lignes: [
      { compte: `cash:${input.compteId}`, montant: -input.delta },
      { compte: 'stock:telephones', montant: input.delta },
    ],
  })
}

export function transfertCashMovement(input: {
  date: string
  compteSourceId: string
  compteDestId: string
  montant: number
  libelle: string
}): Movement {
  return buildMovement({
    date: input.date,
    type: 'transfert_cash',
    libelle: input.libelle,
    lignes: [
      { compte: `cash:${input.compteSourceId}`, montant: -input.montant },
      { compte: `cash:${input.compteDestId}`, montant: input.montant },
    ],
  })
}

/**
 * Annule la contribution d'UNE SEULE pièce dans un mouvement qui peut en
 * regrouper plusieurs (un `achat_piece` peut acheter 3 pièces différentes en
 * une seule commande). Ne reverse que la part de ce mouvement concernant
 * cette pièce ; les autres pièces du même mouvement restent intactes.
 * Le sens (ajout ou retrait de stock à annuler) est déduit du signe de la
 * ligne `stock:pieces` du mouvement d'origine, pas de son `type`.
 */
export function annulerContributionPieceMovement(input: {
  date: string
  libelle: string
  original: Movement
  partId: string
}): Movement {
  const partEntry = input.original.meta?.parts?.find((p) => p.partId === input.partId)
  if (!partEntry) throw new Error("Cette pièce ne fait pas partie de ce mouvement.")
  const ligneStockPieces = input.original.lignes.find((l) => l.compte === 'stock:pieces')
  const autreLigne = input.original.lignes.find((l) => l.compte !== 'stock:pieces')
  if (!ligneStockPieces || !autreLigne) throw new Error('Mouvement de pièce incomplet.')
  const contribution = partEntry.qte * partEntry.coutUnitaire
  const signeStock = ligneStockPieces.montant >= 0 ? 1 : -1
  return buildMovement({
    date: input.date,
    type: 'ajustement',
    libelle: input.libelle,
    refId: input.original.id,
    meta: { parts: [{ partId: input.partId, qte: partEntry.qte, coutUnitaire: partEntry.coutUnitaire }] },
    lignes: [
      { compte: 'stock:pieces', montant: -signeStock * contribution },
      { compte: autreLigne.compte, montant: signeStock * contribution },
    ],
  })
}

/**
 * Correction append-only : ajoute un mouvement inverse à un mouvement existant.
 * `meta.parts` est repris tel quel (qte/coûts inchangés) : c'est le signe opposé
 * de la ligne `stock:pieces` qui indique au moteur de stock (`lib/ledger/stock.ts`)
 * que l'effet sur le stock de pièces doit lui aussi être annulé.
 */
export function ajustementMovement(input: { date: string; libelle: string; original: Movement }): Movement {
  return buildMovement({
    date: input.date,
    type: 'ajustement',
    libelle: input.libelle,
    refId: input.original.id,
    lignes: input.original.lignes.map((l) => ({ compte: l.compte, montant: -l.montant })),
    meta: input.original.meta,
  })
}
