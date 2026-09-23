import { useOnlineStatus } from '../hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 6l8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      You're offline — changes are saved and will sync automatically.
    </div>
  )
}
