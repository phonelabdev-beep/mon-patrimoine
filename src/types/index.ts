// Tous les montants sont des entiers en centimes. Jamais de décimaux stockés.

export type Compte =
  | `cash:${string}` // un compte cash par id
  | 'stock:telephones'
  | 'stock:pieces'
  | 'resultat:revente'
  | 'resultat:reparation'
  | 'resultat:depenses'
  | 'capital:apport' // contrepartie d'un solde de départ/apport : ce compte lui-même n'entre
  // jamais dans le calcul du patrimoine ni du bénéfice — seule la ligne cash:X en face
  // fait monter le patrimoine, comme un dépôt d'argent déjà possédé, pas un gain

export type MovementType =
  | 'achat_telephone'
  | 'achat_piece'
  | 'utilisation_piece'
  | 'reparation'
  | 'vente_telephone'
  | 'depense'
  | 'ajustement'
  | 'transfert_cash'
  | 'solde_initial'

export type MovementLigne = {
  compte: Compte
  montant: number // centimes, la somme des lignes d'un mouvement doit valoir 0
}

// Référence à la pièce concernée par une ligne stock:pieces d'un mouvement
// (achat_piece peut regrouper plusieurs pièces en une seule commande ;
// utilisation_piece ne référence toujours qu'une seule pièce).
export type MovementPartMeta = {
  partId: string
  qte: number
  coutUnitaire: number // centimes, figé au moment du mouvement
}

export type Movement = {
  id: string
  date: string // ISO YYYY-MM-DD
  type: MovementType
  libelle: string
  lignes: MovementLigne[]
  refId?: string // id de l'entité liée (Phone, Repair, ou mouvement d'origine pour un ajustement)
  meta?: { parts?: MovementPartMeta[] }
  createdAt: string // ISO datetime, sert de départage à tri égal de date
}

export type PhoneStatut = 'en_stock' | 'en_reparation' | 'en_vente' | 'vendu'

export type Phone = {
  id: string
  modele: string
  couleur: string
  stockage?: string
  dateAchat: string
  prixAchat: number // centimes, tout compris
  reparationEstimee: number // centimes
  prixVenteVise: number // centimes
  statut: PhoneStatut
  dateVente?: string
  prixVente?: number
  notes?: string
  // Valeur estimée d'une pièce d'origine récupérable (ex: écran fissuré mais
  // fonctionnel). Purement déductif dans les calculs de marge — jamais un
  // mouvement, jamais une extraction réelle de stock de pièces.
  valeurPieceRecuperable?: number
}

export type Part = {
  id: string
  nom: string
  categorie: string
  compatibilite: string[]
  fournisseur?: string
  seuilAlerte: number
}

export type Repair = {
  id: string
  date: string
  appareil: string
  client?: string
  piecesUtilisees: { partId: string; qte: number; coutUnitaireFige: number }[]
  prixFacture: number // centimes
  compteEncaissement: string // id de CashAccount
  notes?: string
}

export type ExpenseCategorie = 'perso' | 'pro' | 'outillage' | 'transport' | 'autre'

export type Expense = {
  id: string
  date: string
  montant: number // centimes
  motif: string
  categorie: ExpenseCategorie
  compte: string // id de CashAccount
}

export type CashAccountType = 'especes' | 'banque' | 'paypal' | 'vinted' | 'autre'

export type CashAccount = {
  id: string
  nom: string
  type: CashAccountType
}
