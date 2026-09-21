import { useMemo } from 'react'
import { todayISO } from '../lib/date'
import type { Task, TaskGroup } from '../types'
import { TaskItem } from './TaskItem'

const PRIORITY_RANK: Record<Task['priority'], number> = { high: 0, medium: 1, low: 2 }

interface TodayViewProps {
  uid: string
  tasks: Task[]
  groups: TaskGroup[]
}

export function TodayView({ uid, tasks, groups }: TodayViewProps) {
  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups])

  const dueTasks = useMemo(() => {
    const today = todayISO()
    return tasks
      .filter((t) => t.dueDate !== null && t.dueDate <= today)
      .sort((a, b) => {
        if (a.dueDate !== b.dueDate) return (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
        if (a.priority !== b.priority) return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
        return a.order - b.order
      })
  }, [tasks])

  if (dueTasks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400 dark:border-slate-700">
        Nothing due today.
      </p>
    )
  }

  return (
    <ul className="space-y-1.5">
      {dueTasks.map((task) => {
        const group = groupById.get(task.groupId)
        return (
          <li key={task.id}>
            <TaskItem uid={uid} task={task} color={group?.color ?? '#3b82f6'} groupName={group?.name} />
          </li>
        )
      })}
    </ul>
  )
}
