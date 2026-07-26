const EUR_FORMATTER = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

/** Formate un montant en centimes en euros lisibles (ex: 12345 -> "123,45 €"). */
export function formatEUR(cents: number): string {
  return EUR_FORMATTER.format(cents / 100)
}

/**
 * Convertit une saisie utilisateur (ex: "12,34" ou "12.34") en centimes entiers.
 * Retourne null si la saisie n'est pas un nombre valide. Les montants négatifs
 * sont rejetés : aucun champ de l'app (prix, montant, coût unitaire) ne doit
 * légitimement accepter une valeur négative ; le sens (+/-) est toujours géré
 * par le moteur de calcul via les lignes du mouvement, pas par la saisie.
 */
export function parseEURInputToCents(input: string): number | null {
  const normalized = input.trim().replace(',', '.')
  if (normalized === '') return null
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  return Math.round(parseFloat(normalized) * 100)
}
