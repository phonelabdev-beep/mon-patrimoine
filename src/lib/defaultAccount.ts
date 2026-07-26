import { useAppStore } from '@/store/useAppStore'

/**
 * Résout le compte cash unique par défaut de l'app (créé une seule fois, la
 * première fois qu'une action rapide en a besoin). Les formulaires n'exposent
 * plus de sélection de compte — voir Réglages/Trésorerie pour la gestion
 * avancée si plusieurs comptes existent déjà.
 */
export function resolveCompteParDefautId(): string {
  const { cashAccounts, ajouterCompteCash } = useAppStore.getState()
  if (cashAccounts.length > 0) return cashAccounts[0].id
  return ajouterCompteCash({ nom: 'Principal', type: 'autre' }).id
}
