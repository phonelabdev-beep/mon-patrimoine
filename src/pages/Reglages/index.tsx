import { useRef, useState } from 'react'
import { z } from 'zod'
import { useAppStore } from '@/store/useAppStore'
import type { CashAccountType } from '@/types'
import { buildExport, parseImportedData } from '@/lib/importExport'
import { todayISO } from '@/lib/dates'
import { parseEURInputToCents } from '@/lib/money'
import { inputClass } from '@/components/ui/Field'

const TYPES: { value: CashAccountType; label: string }[] = [
  { value: 'especes', label: 'Espèces' },
  { value: 'banque', label: 'Banque' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'vinted', label: 'Vinted' },
  { value: 'autre', label: 'Autre' },
]

const TYPE_LABELS = Object.fromEntries(TYPES.map((t) => [t.value, t.label])) as Record<CashAccountType, string>

export default function Reglages() {
  const cashAccounts = useAppStore((s) => s.cashAccounts)
  const ajouterCompteCash = useAppStore((s) => s.ajouterCompteCash)
  const ajouterSoldeInitial = useAppStore((s) => s.ajouterSoldeInitial)
  const remplacerToutesLesDonnees = useAppStore((s) => s.remplacerToutesLesDonnees)

  const [nom, setNom] = useState('')
  const [type, setType] = useState<CashAccountType>('especes')
  const [soldeDepart, setSoldeDepart] = useState('')
  const [importErreur, setImportErreur] = useState<string | null>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleAjouterCompte() {
    if (!nom.trim()) return
    const compte = ajouterCompteCash({ nom: nom.trim(), type })
    const soldeCents = parseEURInputToCents(soldeDepart)
    if (soldeCents != null && soldeCents > 0) {
      ajouterSoldeInitial({ compteId: compte.id, montant: soldeCents, date: todayISO(), libelle: 'Solde de départ' })
    }
    setNom('')
    setSoldeDepart('')
  }

  function handleExport() {
    const { movements, phones, parts, repairs, expenses, cashAccounts } = useAppStore.getState()
    const data = buildExport({ movements, phones, parts, repairs, expenses, cashAccounts })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `patrimoine-phones-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    setImportErreur(null)
    setImportMessage(null)
    fileInputRef.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportErreur(null)
    setImportMessage(null)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const data = parseImportedData(json)
      const confirme = window.confirm(
        "Importer ce fichier va remplacer TOUTES les données actuelles de l'application. Cette action est irréversible. Continuer ?",
      )
      if (!confirme) return
      remplacerToutesLesDonnees(data)
      setImportMessage('Import réussi.')
    } catch (err) {
      if (err instanceof z.ZodError) {
        setImportErreur(`Fichier invalide : ${err.issues[0]?.message ?? 'format inattendu'}.`)
      } else if (err instanceof SyntaxError) {
        setImportErreur("Ce fichier n'est pas un JSON valide.")
      } else {
        setImportErreur(err instanceof Error ? err.message : 'Erreur inconnue.')
      }
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <h1 className="mb-4 text-xl font-semibold">Réglages</h1>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium text-zinc-400">Comptes cash</h2>
        {cashAccounts.length === 0 ? (
          <p className="mb-3 text-sm text-zinc-500">Aucun compte pour l'instant.</p>
        ) : (
          <ul className="mb-3 flex flex-col gap-2">
            {cashAccounts.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900 shadow-md shadow-black/20 ring-1 ring-white/[0.03] p-3 text-sm">
                <span>{c.nom}</span>
                <span className="text-zinc-400">{TYPE_LABELS[c.type]}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-zinc-700 p-3">
          <input className={inputClass} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du compte" />
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as CashAccountType)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            inputMode="decimal"
            className={inputClass}
            value={soldeDepart}
            onChange={(e) => setSoldeDepart(e.target.value)}
            placeholder="Solde de départ (€), optionnel"
          />
          <button type="button" onClick={handleAjouterCompte} className="min-h-[44px] rounded-lg bg-indigo-500 font-medium text-white">
            Ajouter le compte
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-400">Export / Import</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Les données ne vivent que sur cet appareil. Exporte régulièrement une sauvegarde JSON.
        </p>
        <div className="flex flex-col gap-3">
          <button type="button" onClick={handleExport} className="min-h-[44px] rounded-lg border border-zinc-700 font-medium text-zinc-100">
            Exporter mes données (JSON)
          </button>
          <div>
            <button type="button" onClick={handleImportClick} className="min-h-[44px] w-full rounded-lg border border-zinc-700 font-medium text-zinc-100">
              Importer un fichier JSON
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          </div>
          {importErreur && <p className="text-sm text-red-400">{importErreur}</p>}
          {importMessage && <p className="text-sm text-emerald-400">{importMessage}</p>}
        </div>
      </section>
    </div>
  )
}
