import { isoDateFromMillis, todayISO } from './date'
import type { Task } from '../types'

export interface TaskStats {
  completedToday: number
  open: number
  overallPercent: number
  streak: number
}

const DAY_MS = 86_400_000

export function computeStats(tasks: Task[]): TaskStats {
  const today = todayISO()

  const completedToday = tasks.filter(
    (t) => t.completedAt != null && isoDateFromMillis(t.completedAt) === today,
  ).length

  const open = tasks.filter((t) => t.percent < 100).length

  const overallPercent = tasks.length
    ? Math.round(tasks.reduce((sum, t) => sum + t.percent, 0) / tasks.length)
    : 0

  const completedDays = new Set(
    tasks.filter((t): t is Task & { completedAt: number } => t.completedAt != null).map((t) => isoDateFromMillis(t.completedAt)),
  )
  const yesterday = isoDateFromMillis(Date.now() - DAY_MS)

  let cursor: number | null = completedDays.has(today)
    ? Date.now()
    : completedDays.has(yesterday)
      ? Date.now() - DAY_MS
      : null

  let streak = 0
  while (cursor !== null && completedDays.has(isoDateFromMillis(cursor))) {
    streak++
    cursor -= DAY_MS
  }

  return { completedToday, open, overallPercent, streak }
}
