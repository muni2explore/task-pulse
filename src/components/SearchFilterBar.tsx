import type { Priority } from '../types'

interface SearchFilterBarProps {
  query: string
  onQueryChange: (value: string) => void
  priority: Priority | 'all'
  onPriorityChange: (value: Priority | 'all') => void
}

export function SearchFilterBar({ query, onQueryChange, priority, onPriorityChange }: SearchFilterBarProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search tasks…"
        className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-slate-400 dark:border-slate-700"
      />
      <select
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value as Priority | 'all')}
        className="shrink-0 rounded-lg border border-slate-200 bg-transparent px-2 py-1.5 text-sm outline-none dark:border-slate-700"
      >
        <option value="all">All priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  )
}
