/** Identifiant unique pour une entité ou un mouvement. */
export function newId(): string {
  return crypto.randomUUID()
}
