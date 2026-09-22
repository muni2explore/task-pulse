import type { ReactNode } from 'react'
import type { TaskStats } from '../lib/analytics'

interface AnalyticsBarProps {
  stats: TaskStats
}

function Chip({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

export function AnalyticsBar({ stats }: AnalyticsBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {stats.streak > 0 && (
        <Chip className="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path
              fillRule="evenodd"
              d="M10 2c.7 2.5 2.5 3.8 4 5.5 1.3 1.5 2 3 2 4.5a6 6 0 11-12 0c0-1 .3-2 1-3 .2 1 .8 1.7 1.5 1.7-.3-2 .3-4 2-5.2-.2 1 0 1.8.7 2.2.3-2 .3-3.7.8-5.2z"
              clipRule="evenodd"
            />
          </svg>
          {stats.streak}-day streak
        </Chip>
      )}
      <Chip className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
        {stats.completedToday} completed today
      </Chip>
      <Chip className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {stats.open} open
      </Chip>
      <Chip className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
        {stats.overallPercent}% overall
      </Chip>
    </div>
  )
}
