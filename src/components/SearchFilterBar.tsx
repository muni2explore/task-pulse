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
      <div className="relative flex-1">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search tasks…"
          className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-8 text-sm outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M6.28 6.22a.75.75 0 10-1.06 1.06L8.94 11l-3.72 3.72a.75.75 0 101.06 1.06L10 12.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 11l3.72-3.72a.75.75 0 00-1.06-1.06L10 9.94 6.28 6.22z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
      <select
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value as Priority | 'all')}
        className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900"
      >
        <option value="all">All priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  )
}
