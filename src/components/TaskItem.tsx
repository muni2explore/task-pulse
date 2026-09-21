import type { HTMLAttributes } from 'react'
import { useState } from 'react'
import { addDaysISO, formatDueLabel, todayISO } from '../lib/date'
import { deleteTask, restoreTask, setTaskPercent, updateTask } from '../lib/tasksApi'
import { useToastStore } from '../store/useToastStore'
import type { Task } from '../types'
import { ProgressBar } from './ProgressBar'

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  low: 'text-slate-400',
  medium: 'text-amber-500',
  high: 'text-rose-500',
}

interface TaskItemProps {
  uid: string
  task: Task
  color: string
  groupName?: string
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>
}

export function TaskItem({ uid, task, color, groupName, dragHandleProps }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false)
  const pushToast = useToastStore((s) => s.push)
  const done = task.percent >= 100
  const due = formatDueLabel(task.dueDate)

  function toggleDone() {
    setTaskPercent(uid, task.id, done ? 0 : 100)
  }

  function bump(delta: number) {
    setTaskPercent(uid, task.id, task.percent + delta)
  }

  function handleDelete() {
    deleteTask(uid, task.id)
    pushToast({
      message: `Deleted "${task.title}"`,
      actionLabel: 'Undo',
      onAction: () => restoreTask(uid, task),
    })
  }

  return (
    <div className="group rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        {dragHandleProps && (
          <button
            {...dragHandleProps}
            aria-label="Drag to reorder"
            className="shrink-0 cursor-grab touch-none text-slate-300 opacity-0 hover:text-slate-500 group-hover:opacity-100"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M7 4a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm5-12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
            </svg>
          </button>
        )}

        <button
          onClick={toggleDone}
          aria-label={done ? 'Mark as not done' : 'Mark as done'}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
          style={{ borderColor: color, backgroundColor: done ? color : 'transparent' }}
        >
          {done && (
            <svg viewBox="0 0 20 20" fill="white" className="h-3 w-3">
              <path d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L8.3 11.6l6.3-6.3a1 1 0 011.4 0z" />
            </svg>
          )}
        </button>

        <button
          className="flex flex-1 items-center gap-2 truncate text-left text-sm"
          onClick={() => setExpanded((v) => !v)}
        >
          {groupName && (
            <span
              className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {groupName}
            </span>
          )}
          <span className={`truncate ${done ? 'text-slate-400 line-through' : ''}`}>{task.title}</span>
        </button>

        {due && (
          <span className={`shrink-0 text-xs ${due.overdue && !done ? 'font-medium text-rose-500' : 'text-slate-400'}`}>
            {due.label}
          </span>
        )}

        <span className={`text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority !== 'medium' && task.priority}
        </span>

        <span className="w-9 shrink-0 text-right text-xs tabular-nums text-slate-500">
          {task.percent}%
        </span>

        <button
          onClick={handleDelete}
          aria-label="Delete task"
          className="shrink-0 text-slate-300 opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.5h-3.5a.75.75 0 000 1.5h.54l.83 10.78A2.75 2.75 0 006.6 19h6.8a2.75 2.75 0 002.73-2.47l.83-10.78h.54a.75.75 0 000-1.5H14v-.5A2.75 2.75 0 0011.25 1h-2.5zM7.5 4.25v-.5c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v.5h-5z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="mt-2 pl-8">
        <ProgressBar percent={task.percent} color={color} />
      </div>

      {expanded && (
        <div className="mt-2 space-y-2 pl-8">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={task.percent}
              onChange={(e) => setTaskPercent(uid, task.id, Number(e.target.value))}
              className="flex-1 accent-current"
              style={{ color }}
            />
            <button
              onClick={() => bump(-10)}
              className="rounded border border-slate-200 px-1.5 py-0.5 text-xs dark:border-slate-700"
            >
              -10
            </button>
            <button
              onClick={() => bump(10)}
              className="rounded border border-slate-200 px-1.5 py-0.5 text-xs dark:border-slate-700"
            >
              +10
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Due</span>
            <input
              type="date"
              value={task.dueDate ?? ''}
              onChange={(e) => updateTask(uid, task.id, { dueDate: e.target.value || null })}
              className="rounded border border-slate-200 bg-transparent px-1.5 py-0.5 dark:border-slate-700"
            />
            <button
              onClick={() => updateTask(uid, task.id, { dueDate: todayISO() })}
              className="rounded border border-slate-200 px-1.5 py-0.5 dark:border-slate-700"
            >
              Today
            </button>
            <button
              onClick={() => updateTask(uid, task.id, { dueDate: addDaysISO(1) })}
              className="rounded border border-slate-200 px-1.5 py-0.5 dark:border-slate-700"
            >
              Tomorrow
            </button>
            {task.dueDate && (
              <button
                onClick={() => updateTask(uid, task.id, { dueDate: null })}
                className="text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
