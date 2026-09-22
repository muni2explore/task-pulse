export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysISO(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
}

export function isoDateFromMillis(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

export type DateBucket = 'Today' | 'Yesterday' | 'This week' | 'Earlier'

export function bucketForDate(ms: number): DateBucket {
  const iso = isoDateFromMillis(ms)
  const today = todayISO()
  if (iso === today) return 'Today'
  if (iso === addDaysISO(-1)) return 'Yesterday'
  const daysAgo = Math.round((Date.parse(today) - Date.parse(iso)) / 86_400_000)
  return daysAgo <= 7 ? 'This week' : 'Earlier'
}

export function formatDueLabel(dueDate: string | null): { label: string; overdue: boolean } | null {
  if (!dueDate) return null
  const today = todayISO()
  if (dueDate === today) return { label: 'Today', overdue: false }
  if (dueDate === addDaysISO(1)) return { label: 'Tomorrow', overdue: false }
  if (dueDate === addDaysISO(-1)) return { label: 'Yesterday', overdue: true }

  const label = new Date(`${dueDate}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  return { label, overdue: dueDate < today }
}
