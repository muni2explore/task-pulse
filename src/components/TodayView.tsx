import { useMemo } from 'react'
import { todayISO } from '../lib/date'
import type { Task, TaskGroup } from '../types'
import { TaskItem } from './TaskItem'

const PRIORITY_RANK: Record<Task['priority'], number> = { high: 0, medium: 1, low: 2 }

interface TodayViewProps {
  uid: string
  tasks: Task[]
  groups: TaskGroup[]
  selectMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (taskId: string) => void
}

export function TodayView({ uid, tasks, groups, selectMode, selectedIds, onToggleSelect }: TodayViewProps) {
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
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
        <svg viewBox="0 0 20 20" fill="none" className="h-8 w-8 text-slate-300 dark:text-slate-600">
          <path
            d="M5 10.5l2.5 2.5 4-5.5M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-sm text-slate-400">Nothing due today.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-1.5">
      {dueTasks.map((task) => {
        const group = groupById.get(task.groupId)
        return (
          <li key={task.id}>
            <TaskItem
              uid={uid}
              task={task}
              color={group?.color ?? '#3b82f6'}
              groupName={group?.name}
              selectMode={selectMode}
              selected={selectedIds?.has(task.id)}
              onToggleSelect={() => onToggleSelect?.(task.id)}
            />
          </li>
        )
      })}
    </ul>
  )
}
