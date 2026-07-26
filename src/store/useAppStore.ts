import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Movement,
  Phone,
  PhoneStatut,
  Part,
  Repair,
  Expense,
  ExpenseCategorie,
  CashAccount,
  CashAccountType,
} from '@/types'
import { newId } from '@/lib/id'
import { idbStorage } from '@/lib/idb'
import { todayISO } from '@/lib/dates'
import { stockPart, coutUnitaireMoyen } from '@/lib/ledger/stock'
import {
  achatTelephoneMovement,
  achatPieceMovement,
  utilisationPieceMovement,
  reparationMovement,
  venteTelephoneMovement,
  depenseMovement,
  transfertCashMovement,
  soldeInitialMovement,
  correctionPrixAchatMovement,
  annulerContributionPieceMovement,
  ajustementMovement,
} from '@/lib/ledger/movements'

type AchatTelephoneInput = {
  modele: string
  couleur: string
  stockage?: string
  dateAchat: string
  prixAchat: number
  reparationEstimee: number
  prixVenteVise: number
  compteId: string
  notes?: string
  valeurPieceRecuperable?: number
}

type ModifierTelephoneInput = Partial<{
  modele: string
  couleur: string
  stockage: string
  dateAchat: string
  prixAchat: number
  reparationEstimee: number
  prixVenteVise: number
  statut: PhoneStatut
  notes: string
  valeurPieceRecuperable: number
}>

type ModifierPieceInput = Partial<{
  nom: string
  categorie: string
  compatibilite: string[]
  fournisseur: string
  seuilAlerte: number
}>

type AchatPieceLigneInput = {
  partId?: string
  nouvellePart?: {
    nom: string
    categorie: string
    compatibilite: string[]
    fournisseur?: string
    seuilAlerte: number
  }
  qte: number
  prixUnitaire: number
}

type AchatPiecesInput = {
  date: string
  compteId: string
  libelle: string
  lignes: AchatPieceLigneInput[]
}

type UtilisationPieceSurTelephoneInput = {
  date: string
  partId: string
  qte: number
  phoneId: string
  libelle: string
}

type CreerReparationInput = {
  date: string
  appareil: string
  client?: string
  pieces: { partId: string; qte: number }[]
  prixFacture: number
  compteEncaissement: string
  notes?: string
}

type VenteTelephoneInput = {
  phoneId: string
  date: string
  prixVente: number
  compteId: string
}

type CreerDepenseInput = {
  date: string
  montant: number
  motif: string
  categorie: ExpenseCategorie
  compteId: string
}

type TransfertCashInput = {
  date: string
  compteSourceId: string
  compteDestId: string
  montant: number
  libelle: string
}

type AjouterCompteCashInput = {
  nom: string
  type: CashAccountType
}

type AjouterSoldeInitialInput = {
  compteId: string
  montant: number
  date: string
  libelle: string
}

export type PersistedData = {
  movements: Movement[]
  phones: Phone[]
  parts: Part[]
  repairs: Repair[]
  expenses: Expense[]
  cashAccounts: CashAccount[]
}

export type AppState = {
  hydrated: boolean

  movements: Movement[]
  phones: Phone[]
  parts: Part[]
  repairs: Repair[]
  expenses: Expense[]
  cashAccounts: CashAccount[]

  achatTelephone: (input: AchatTelephoneInput) => void
  achatPieces: (input: AchatPiecesInput) => void
  utilisationPieceSurTelephone: (input: UtilisationPieceSurTelephoneInput) => void
  creerReparation: (input: CreerReparationInput) => void
  venteTelephone: (input: VenteTelephoneInput) => void
  creerDepense: (input: CreerDepenseInput) => void
  transfertCash: (input: TransfertCashInput) => void
  ajouterSoldeInitial: (input: AjouterSoldeInitialInput) => void
  ajusterMouvement: (movementId: string, libelle: string, date: string) => void
  ajouterCompteCash: (input: AjouterCompteCashInput) => CashAccount
  modifierTelephone: (phoneId: string, patch: ModifierTelephoneInput) => void
  supprimerTelephone: (phoneId: string) => void
  modifierPiece: (partId: string, patch: ModifierPieceInput) => void
  supprimerPiece: (partId: string) => void
  supprimerReparation: (repairId: string) => void
  remplacerToutesLesDonnees: (data: PersistedData) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,

      movements: [],
      phones: [],
      parts: [],
      repairs: [],
      expenses: [],
      cashAccounts: [],

      achatTelephone: (input) => {
        const id = newId()
        const phone: Phone = {
          id,
          modele: input.modele,
          couleur: input.couleur,
          stockage: input.stockage,
          dateAchat: input.dateAchat,
          prixAchat: input.prixAchat,
          reparationEstimee: input.reparationEstimee,
          prixVenteVise: input.prixVenteVise,
          statut: 'en_stock',
          notes: input.notes,
          valeurPieceRecuperable: input.valeurPieceRecuperable,
        }
        const movement = achatTelephoneMovement({
          date: input.dateAchat,
          compteId: input.compteId,
          montant: input.prixAchat,
          libelle: `Achat ${input.modele}`,
          refId: id,
        })
        set((state) => ({ phones: [...state.phones, phone], movements: [...state.movements, movement] }))
      },

      achatPieces: (input) => {
        const nouvellesParts: Part[] = []
        const parts = input.lignes.map((ligne) => {
          let partId = ligne.partId
          if (!partId) {
            if (!ligne.nouvellePart) {
              throw new Error('Chaque ligne doit référencer une pièce existante ou en décrire une nouvelle.')
            }
            partId = newId()
            nouvellesParts.push({ id: partId, ...ligne.nouvellePart })
          }
          return { partId, qte: ligne.qte, coutUnitaire: ligne.prixUnitaire }
        })
        const movement = achatPieceMovement({ date: input.date, compteId: input.compteId, libelle: input.libelle, parts })
        set((state) => ({
          parts: [...state.parts, ...nouvellesParts],
          movements: [...state.movements, movement],
        }))
      },

      utilisationPieceSurTelephone: (input) => {
        const { movements, phones } = get()
        const phone = phones.find((p) => p.id === input.phoneId)
        if (!phone) throw new Error("Téléphone introuvable.")
        if (phone.statut === 'vendu') throw new Error('Ce téléphone est déjà vendu.')
        const stock = stockPart(movements, input.partId)
        if (input.qte > stock.quantite) {
          throw new Error(`Stock insuffisant : ${stock.quantite} disponible(s), ${input.qte} demandé(s).`)
        }
        const coutUnitaireFige = coutUnitaireMoyen(stock)
        const movement = utilisationPieceMovement({
          date: input.date,
          partId: input.partId,
          qte: input.qte,
          coutUnitaireFige,
          destination: 'revente',
          refId: input.phoneId,
          libelle: input.libelle,
        })
        set((state) => ({ movements: [...state.movements, movement] }))
      },

      creerReparation: (input) => {
        const { movements } = get()
        const pieces = input.pieces.filter((p) => p.qte > 0)

        const qteParPiece = new Map<string, number>()
        for (const p of pieces) qteParPiece.set(p.partId, (qteParPiece.get(p.partId) ?? 0) + p.qte)
        for (const [partId, qteDemandee] of qteParPiece) {
          const disponible = stockPart(movements, partId).quantite
          if (qteDemandee > disponible) {
            throw new Error(`Stock insuffisant pour une pièce : ${disponible} disponible(s), ${qteDemandee} demandé(s).`)
          }
        }

        const repairId = newId()
        const piecesUtilisees = pieces.map((p) => ({
          partId: p.partId,
          qte: p.qte,
          coutUnitaireFige: coutUnitaireMoyen(stockPart(movements, p.partId)),
        }))

        const utilisationMovements = piecesUtilisees.map((p) =>
          utilisationPieceMovement({
            date: input.date,
            partId: p.partId,
            qte: p.qte,
            coutUnitaireFige: p.coutUnitaireFige,
            destination: 'reparation',
            refId: repairId,
            libelle: `Pièce pour réparation : ${input.appareil}`,
          }),
        )
        const reparationMvt = reparationMovement({
          date: input.date,
          compteId: input.compteEncaissement,
          montant: input.prixFacture,
          libelle: `Réparation : ${input.appareil}`,
          refId: repairId,
        })

        const repair: Repair = {
          id: repairId,
          date: input.date,
          appareil: input.appareil,
          client: input.client,
          piecesUtilisees,
          prixFacture: input.prixFacture,
          compteEncaissement: input.compteEncaissement,
          notes: input.notes,
        }

        set((state) => ({
          repairs: [...state.repairs, repair],
          movements: [...state.movements, ...utilisationMovements, reparationMvt],
        }))
      },

      venteTelephone: (input) => {
        const phone = get().phones.find((p) => p.id === input.phoneId)
        if (!phone) throw new Error('Téléphone introuvable.')
        if (phone.statut === 'vendu') throw new Error('Ce téléphone est déjà vendu.')
        const movement = venteTelephoneMovement({
          date: input.date,
          compteId: input.compteId,
          prixVente: input.prixVente,
          prixAchat: phone.prixAchat,
          libelle: `Vente ${phone.modele}`,
          refId: phone.id,
        })
        const phoneMisAJour: Phone = {
          ...phone,
          statut: 'vendu',
          prixVente: input.prixVente,
          dateVente: input.date,
        }
        set((state) => ({
          phones: state.phones.map((p) => (p.id === phone.id ? phoneMisAJour : p)),
          movements: [...state.movements, movement],
        }))
      },

      creerDepense: (input) => {
        const id = newId()
        const expense: Expense = {
          id,
          date: input.date,
          montant: input.montant,
          motif: input.motif,
          categorie: input.categorie,
          compte: input.compteId,
        }
        const movement = depenseMovement({
          date: input.date,
          compteId: input.compteId,
          montant: input.montant,
          libelle: input.motif,
          refId: id,
        })
        set((state) => ({ expenses: [...state.expenses, expense], movements: [...state.movements, movement] }))
      },

      transfertCash: (input) => {
        if (input.compteSourceId === input.compteDestId) throw new Error('Les deux comptes doivent être différents.')
        if (input.montant <= 0) throw new Error('Le montant doit être positif.')
        const movement = transfertCashMovement(input)
        set((state) => ({ movements: [...state.movements, movement] }))
      },

      ajouterSoldeInitial: (input) => {
        if (input.montant === 0) throw new Error('Le montant ne peut pas être nul.')
        const movement = soldeInitialMovement(input)
        set((state) => ({ movements: [...state.movements, movement] }))
      },

      ajusterMouvement: (movementId, libelle, date) => {
        const { movements } = get()
        const original = movements.find((m) => m.id === movementId)
        if (!original) throw new Error('Mouvement introuvable.')
        if (movements.some((m) => m.type === 'ajustement' && m.refId === movementId)) {
          throw new Error('Ce mouvement a déjà été corrigé.')
        }
        const movement = ajustementMovement({ date, libelle, original })
        set((state) => ({ movements: [...state.movements, movement] }))
      },

      ajouterCompteCash: (input) => {
        const account: CashAccount = { id: newId(), nom: input.nom, type: input.type }
        set((state) => ({ cashAccounts: [...state.cashAccounts, account] }))
        return account
      },

      modifierTelephone: (phoneId, patch) => {
        const { phones, movements } = get()
        const phone = phones.find((p) => p.id === phoneId)
        if (!phone) throw new Error('Téléphone introuvable.')

        if (patch.statut !== undefined && patch.statut !== phone.statut) {
          if (phone.statut === 'vendu' || patch.statut === 'vendu') {
            throw new Error('Utilise "Vendre" pour marquer un téléphone comme vendu — le statut ne se change pas ici.')
          }
        }

        const nouveauxMouvements: Movement[] = []
        if (patch.prixAchat !== undefined && patch.prixAchat !== phone.prixAchat) {
          if (phone.statut === 'vendu') {
            throw new Error("Le prix d'achat ne peut plus être modifié une fois le téléphone vendu.")
          }
          const achatOriginal = movements.find((m) => m.type === 'achat_telephone' && m.refId === phoneId)
          if (!achatOriginal) throw new Error("Mouvement d'achat introuvable pour ce téléphone.")
          const ligneCash = achatOriginal.lignes.find((l) => l.compte.startsWith('cash:'))
          if (!ligneCash) throw new Error("Compte d'achat introuvable pour ce téléphone.")
          const compteId = ligneCash.compte.slice('cash:'.length)
          nouveauxMouvements.push(
            correctionPrixAchatMovement({
              date: todayISO(),
              compteId,
              delta: patch.prixAchat - phone.prixAchat,
              libelle: `Correction prix d'achat : ${phone.modele}`,
              refId: phoneId,
            }),
          )
        }

        set((state) => ({
          phones: state.phones.map((p) => (p.id === phoneId ? { ...p, ...patch } : p)),
          movements: [...state.movements, ...nouveauxMouvements],
        }))
      },

      supprimerTelephone: (phoneId) => {
        const { phones, movements } = get()
        if (!phones.some((p) => p.id === phoneId)) throw new Error('Téléphone introuvable.')
        const dejaAnnules = new Set(
          movements.filter((m) => m.type === 'ajustement' && m.refId).map((m) => m.refId as string),
        )
        const aAnnuler = movements.filter((m) => m.refId === phoneId && m.type !== 'ajustement' && !dejaAnnules.has(m.id))
        const annulations = aAnnuler.map((m) =>
          ajustementMovement({ date: todayISO(), libelle: 'Suppression téléphone', original: m }),
        )
        set((state) => ({
          phones: state.phones.filter((p) => p.id !== phoneId),
          movements: [...state.movements, ...annulations],
        }))
      },

      modifierPiece: (partId, patch) => {
        if (!get().parts.some((p) => p.id === partId)) throw new Error('Pièce introuvable.')
        set((state) => ({ parts: state.parts.map((p) => (p.id === partId ? { ...p, ...patch } : p)) }))
      },

      supprimerPiece: (partId) => {
        const { movements, parts } = get()
        const part = parts.find((p) => p.id === partId)
        if (!part) throw new Error('Pièce introuvable.')
        const dejaAnnulesPourCettePiece = new Set(
          movements
            .filter((m) => m.type === 'ajustement' && m.refId && m.meta?.parts?.some((p) => p.partId === partId))
            .map((m) => m.refId as string),
        )
        const aAnnuler = movements.filter(
          (m) =>
            (m.type === 'achat_piece' || m.type === 'utilisation_piece') &&
            m.meta?.parts?.some((p) => p.partId === partId) &&
            !dejaAnnulesPourCettePiece.has(m.id),
        )
        const annulations = aAnnuler.map((m) =>
          annulerContributionPieceMovement({
            date: todayISO(),
            libelle: `Suppression pièce : ${part.nom}`,
            original: m,
            partId,
          }),
        )
        set((state) => ({
          parts: state.parts.filter((p) => p.id !== partId),
          movements: [...state.movements, ...annulations],
        }))
      },

      supprimerReparation: (repairId) => {
        const { movements, repairs } = get()
        if (!repairs.some((r) => r.id === repairId)) throw new Error('Réparation introuvable.')
        const dejaAnnules = new Set(
          movements.filter((m) => m.type === 'ajustement' && m.refId).map((m) => m.refId as string),
        )
        const aAnnuler = movements.filter((m) => m.refId === repairId && m.type !== 'ajustement' && !dejaAnnules.has(m.id))
        const annulations = aAnnuler.map((m) =>
          ajustementMovement({ date: todayISO(), libelle: 'Suppression réparation', original: m }),
        )
        set((state) => ({
          repairs: state.repairs.filter((r) => r.id !== repairId),
          movements: [...state.movements, ...annulations],
        }))
      },

      remplacerToutesLesDonnees: (data) => {
        set(() => ({ ...data }))
      },
    }),
    {
      name: 'patrimoine-phones-state',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        movements: state.movements,
        phones: state.phones,
        parts: state.parts,
        repairs: state.repairs,
        expenses: state.expenses,
        cashAccounts: state.cashAccounts,
      }),
      onRehydrateStorage: () => () => {
        useAppStore.setState({ hydrated: true })
      },
    },
  ),
)
