/** Date du jour au format ISO (YYYY-MM-DD), en heure locale. */
export function todayISO(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Clé de regroupement mensuel (YYYY-MM) à partir d'une date ISO (YYYY-MM-DD). */
export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7)
}

/** Formate une date ISO (YYYY-MM-DD) en français (ex: "26 juillet 2026"). */
export function formatDateFR(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

/** Formate une clé mensuelle (YYYY-MM) en français (ex: "juillet 2026"). */
export function formatMonthFR(key: string): string {
  const [year, month] = key.split('-').map(Number)
  const d = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d)
}
