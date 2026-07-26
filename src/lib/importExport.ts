import { z } from 'zod'
import type { PersistedData } from '@/store/useAppStore'

const CASH_PREFIX = 'cash:'
const COMPTES_FIXES = [
  'stock:telephones',
  'stock:pieces',
  'resultat:revente',
  'resultat:reparation',
  'resultat:depenses',
  'capital:apport',
] as const

const CompteSchema = z.string().refine(
  (v) => v.startsWith(CASH_PREFIX) || (COMPTES_FIXES as readonly string[]).includes(v),
  { message: 'Compte invalide' },
)

const MovementLigneSchema = z.object({ compte: CompteSchema, montant: z.number().int() })

const MovementSchema = z
  .object({
    id: z.string(),
    date: z.string(),
    type: z.enum([
      'achat_telephone',
      'achat_piece',
      'utilisation_piece',
      'reparation',
      'vente_telephone',
      'depense',
      'ajustement',
      'transfert_cash',
      'solde_initial',
    ]),
    libelle: z.string(),
    lignes: z.array(MovementLigneSchema).min(1),
    refId: z.string().optional(),
    meta: z
      .object({
        parts: z
          .array(z.object({ partId: z.string(), qte: z.number().int().positive(), coutUnitaire: z.number().int() }))
          .optional(),
      })
      .optional(),
    createdAt: z.string(),
  })
  .refine((m) => m.lignes.reduce((s, l) => s + l.montant, 0) === 0, {
    message: "Un mouvement importé a des lignes dont la somme n'est pas 0",
  })
  .refine(
    (m) => {
      if (!m.meta?.parts || m.meta.parts.length === 0) return true
      const ligne = m.lignes.find((l) => l.compte === 'stock:pieces')
      if (!ligne) return false
      const total = m.meta.parts.reduce((s, p) => s + p.qte * p.coutUnitaire, 0)
      return total === Math.abs(ligne.montant)
    },
    { message: "meta.parts d'un mouvement importé ne correspond pas à sa ligne stock:pieces" },
  )

const PhoneSchema = z.object({
  id: z.string(),
  modele: z.string(),
  couleur: z.string(),
  stockage: z.string().optional(),
  dateAchat: z.string(),
  prixAchat: z.number().int(),
  reparationEstimee: z.number().int(),
  prixVenteVise: z.number().int(),
  statut: z.enum(['en_stock', 'en_reparation', 'en_vente', 'vendu']),
  dateVente: z.string().optional(),
  prixVente: z.number().int().optional(),
  notes: z.string().optional(),
})

const PartSchema = z.object({
  id: z.string(),
  nom: z.string(),
  categorie: z.string(),
  compatibilite: z.array(z.string()),
  fournisseur: z.string().optional(),
  seuilAlerte: z.number().int(),
})

const RepairSchema = z.object({
  id: z.string(),
  date: z.string(),
  appareil: z.string(),
  client: z.string().optional(),
  piecesUtilisees: z.array(z.object({ partId: z.string(), qte: z.number().int().positive(), coutUnitaireFige: z.number().int() })),
  prixFacture: z.number().int(),
  compteEncaissement: z.string(),
  notes: z.string().optional(),
})

const ExpenseSchema = z.object({
  id: z.string(),
  date: z.string(),
  montant: z.number().int(),
  motif: z.string(),
  categorie: z.enum(['perso', 'pro', 'outillage', 'transport', 'autre']),
  compte: z.string(),
})

const CashAccountSchema = z.object({
  id: z.string(),
  nom: z.string(),
  type: z.enum(['especes', 'banque', 'paypal', 'vinted', 'autre']),
})

const ExportDataSchema = z.object({
  version: z.number(),
  movements: z.array(MovementSchema),
  phones: z.array(PhoneSchema),
  parts: z.array(PartSchema),
  repairs: z.array(RepairSchema),
  expenses: z.array(ExpenseSchema),
  cashAccounts: z.array(CashAccountSchema),
})

const CURRENT_VERSION = 1

export function buildExport(data: PersistedData) {
  return {
    version: CURRENT_VERSION,
    ...data,
  }
}

/** Valide un JSON importé et retourne les données prêtes à remplacer l'état actuel. Lève une erreur au premier problème. */
export function parseImportedData(raw: unknown): PersistedData {
  const parsed = ExportDataSchema.parse(raw)
  const { version: _version, ...data } = parsed
  // Le schéma zod valide déjà au runtime que `compte` respecte le format `Compte`
  // (préfixe cash: ou l'un des comptes fixes) ; le type inféré reste `string` plus large.
  return data as PersistedData
}
