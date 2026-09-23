import { useMemo } from 'react'
import { type DateBucket, bucketForDate } from '../lib/date'
import type { Task, TaskGroup } from '../types'
import { TaskItem } from './TaskItem'

const BUCKET_ORDER: DateBucket[] = ['Today', 'Yesterday', 'This week', 'Earlier']

interface CompletedViewProps {
  uid: string
  tasks: Task[]
  groups: TaskGroup[]
  selectMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (taskId: string) => void
}

export function CompletedView({ uid, tasks, groups, selectMode, selectedIds, onToggleSelect }: CompletedViewProps) {
  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups])

  const buckets = useMemo(() => {
    const done = tasks
      .filter((t) => t.percent >= 100)
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))

    const map = new Map<DateBucket, Task[]>()
    for (const task of done) {
      const bucket = task.completedAt != null ? bucketForDate(task.completedAt) : 'Earlier'
      const list = map.get(bucket) ?? []
      list.push(task)
      map.set(bucket, list)
    }
    return map
  }, [tasks])

  const hasAny = tasks.some((t) => t.percent >= 100)

  if (!hasAny) {
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
        <p className="text-sm text-slate-400">No completed tasks yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {BUCKET_ORDER.filter((bucket) => (buckets.get(bucket) ?? []).length > 0).map((bucket) => (
        <div key={bucket}>
          <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{bucket}</h2>
          <ul className="space-y-1.5">
            {buckets.get(bucket)!.map((task) => {
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
        </div>
      ))}
    </div>
  )
}
