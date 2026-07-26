import Sheet from './Sheet'

export type ActionSheetAction = {
  label: string
  onClick: () => void
  destructive?: boolean
}

type ActionSheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  actions: ActionSheetAction[]
}

/** Menu d'actions contextuelles sur un élément de liste (téléphone, pièce, réparation…). */
export default function ActionSheet({ open, onClose, title, actions }: ActionSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => {
              onClose()
              a.onClick()
            }}
            className={`min-h-[44px] rounded-lg border px-4 text-left font-medium ${
              a.destructive ? 'border-red-900/50 bg-red-950/30 text-red-400' : 'border-zinc-700 bg-zinc-800 text-zinc-100'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </Sheet>
  )
}
