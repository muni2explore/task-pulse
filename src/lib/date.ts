export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysISO(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
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
