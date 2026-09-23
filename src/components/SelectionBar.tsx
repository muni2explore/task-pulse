interface SelectionBarProps {
  selectMode: boolean
  selectedCount: number
  onToggleSelectMode: () => void
  onBulkComplete: () => void
  onBulkDelete: () => void
}

export function SelectionBar({
  selectMode,
  selectedCount,
  onToggleSelectMode,
  onBulkComplete,
  onBulkDelete,
}: SelectionBarProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onToggleSelectMode}
        className="rounded-full px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
      >
        {selectMode ? 'Cancel' : 'Select'}
      </button>

      {selectMode && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">{selectedCount} selected</span>
          <button
            onClick={onBulkComplete}
            disabled={selectedCount === 0}
            className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-600 transition-colors hover:bg-emerald-100 disabled:pointer-events-none disabled:opacity-40 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
          >
            Complete
          </button>
          <button
            onClick={onBulkDelete}
            disabled={selectedCount === 0}
            className="rounded-full bg-rose-50 px-2.5 py-1 font-medium text-rose-600 transition-colors hover:bg-rose-100 disabled:pointer-events-none disabled:opacity-40 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
