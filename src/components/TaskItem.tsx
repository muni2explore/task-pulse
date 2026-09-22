import type { HTMLAttributes } from 'react'
import { useState } from 'react'
import { addDaysISO, formatDueLabel, todayISO } from '../lib/date'
import { deleteTask, restoreTask, setTaskPercent, spawnNextOccurrence, updateTask } from '../lib/tasksApi'
import { useToastStore } from '../store/useToastStore'
import type { Recurrence, Task } from '../types'
import { ProgressBar } from './ProgressBar'

const PRIORITY_BADGE: Record<Task['priority'], string> = {
  low: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  medium: '',
  high: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
}

const RECURRENCE_LABEL: Record<Recurrence, string> = {
  none: 'None',
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekly: 'Weekly',
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
  const [notesDraft, setNotesDraft] = useState(task.notes)
  // Tracks the last value we synced from, so we can tell "notes changed
  // from outside" (e.g. an Undo restore) apart from "user is typing" —
  // adjusting state during render instead of an effect avoids an extra pass.
  const [syncedNotes, setSyncedNotes] = useState(task.notes)
  if (task.notes !== syncedNotes) {
    setSyncedNotes(task.notes)
    setNotesDraft(task.notes)
  }

  const pushToast = useToastStore((s) => s.push)
  const done = task.percent >= 100
  const due = formatDueLabel(task.dueDate)
  const hasNotes = task.notes.trim() !== ''
  const isRecurring = task.recurrence !== 'none'

  function changePercent(next: number) {
    const clamped = Math.max(0, Math.min(100, next))
    setTaskPercent(uid, task.id, clamped)
    if (clamped >= 100 && task.percent < 100 && isRecurring) {
      spawnNextOccurrence(uid, task)
    }
  }

  function toggleDone() {
    changePercent(done ? 0 : 100)
  }

  function bump(delta: number) {
    changePercent(task.percent + delta)
  }

  function saveNotes() {
    if (notesDraft !== task.notes) updateTask(uid, task.id, { notes: notesDraft })
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
    <div className="group rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/40">
      <div className="flex items-center gap-2">
        {dragHandleProps && (
          <button
            {...dragHandleProps}
            aria-label="Drag to reorder"
            className="shrink-0 cursor-grab touch-none text-slate-300 opacity-0 hover:text-slate-500 focus-visible:opacity-100 group-hover:opacity-100 dark:text-slate-600"
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
            <svg viewBox="0 0 20 20" fill="white" className="h-3 w-3 animate-[check-pop_220ms_ease]">
              <path d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4L8.3 11.6l6.3-6.3a1 1 0 011.4 0z" />
            </svg>
          )}
        </button>

        <button
          className="flex flex-1 items-center gap-1.5 truncate text-left text-sm"
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
          {isRecurring && (
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500"
              aria-label={`Repeats ${RECURRENCE_LABEL[task.recurrence].toLowerCase()}`}
            >
              <title>{`Repeats ${RECURRENCE_LABEL[task.recurrence].toLowerCase()}`}</title>
              <path d="M4 10a6 6 0 019.9-4.5l.6.5h-1.5a.75.75 0 000 1.5h3a.75.75 0 00.75-.75v-3a.75.75 0 00-1.5 0v1.38l-.54-.46A7.5 7.5 0 003 10a.75.75 0 001.5 0A6 6 0 014 10zm12 0a6 6 0 01-9.9 4.5l-.6-.5h1.5a.75.75 0 000-1.5h-3a.75.75 0 00-.75.75v3a.75.75 0 001.5 0v-1.38l.54.46A7.5 7.5 0 0017 10a.75.75 0 00-1.5 0z" />
            </svg>
          )}
          {hasNotes && (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600">
              <title>Has notes</title>
              <path
                fillRule="evenodd"
                d="M4 4.5A1.5 1.5 0 015.5 3h9A1.5 1.5 0 0116 4.5v9.086a1.5 1.5 0 01-.44 1.06l-2.914 2.915a1.5 1.5 0 01-1.06.439H5.5A1.5 1.5 0 014 16.5v-12zm3 2.75a.75.75 0 000 1.5h6a.75.75 0 000-1.5H7zm0 3a.75.75 0 000 1.5h6a.75.75 0 000-1.5H7zm0 3a.75.75 0 000 1.5h3a.75.75 0 000-1.5H7z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {due && (
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs ${
              due.overdue && !done
                ? 'bg-rose-50 font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {due.label}
          </span>
        )}

        {task.priority !== 'medium' && (
          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_BADGE[task.priority]}`}>
            {task.priority}
          </span>
        )}

        <span className="w-9 shrink-0 text-right text-xs tabular-nums text-slate-500">
          {task.percent}%
        </span>

        <button
          onClick={handleDelete}
          aria-label="Delete task"
          className="shrink-0 text-slate-300 opacity-0 transition-opacity hover:text-rose-500 focus-visible:opacity-100 group-hover:opacity-100 dark:text-slate-600"
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

      <div className="mt-2 pl-7">
        <ProgressBar percent={task.percent} color={color} />
      </div>

      {expanded && (
        <div className="mt-2.5 space-y-2.5 pl-7">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={task.percent}
              onChange={(e) => changePercent(Number(e.target.value))}
              className="flex-1 accent-current"
              style={{ color }}
            />
            <button
              onClick={() => bump(-10)}
              className="rounded-md border border-slate-200 px-1.5 py-0.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              -10
            </button>
            <button
              onClick={() => bump(10)}
              className="rounded-md border border-slate-200 px-1.5 py-0.5 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              +10
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="w-9 shrink-0 text-slate-400">Due</span>
            <input
              type="date"
              value={task.dueDate ?? ''}
              onChange={(e) => updateTask(uid, task.id, { dueDate: e.target.value || null })}
              className="rounded-md border border-slate-200 bg-transparent px-1.5 py-0.5 dark:border-slate-700"
            />
            <button
              onClick={() => updateTask(uid, task.id, { dueDate: todayISO() })}
              className="rounded-md border border-slate-200 px-1.5 py-0.5 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Today
            </button>
            <button
              onClick={() => updateTask(uid, task.id, { dueDate: addDaysISO(1) })}
              className="rounded-md border border-slate-200 px-1.5 py-0.5 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Tomorrow
            </button>
            {task.dueDate && (
              <button
                onClick={() => updateTask(uid, task.id, { dueDate: null })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="w-9 shrink-0 text-slate-400">Repeat</span>
            <div className="flex gap-1">
              {(Object.keys(RECURRENCE_LABEL) as Recurrence[]).map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    updateTask(uid, task.id, {
                      recurrence: option,
                      ...(option !== 'none' && !task.dueDate ? { dueDate: todayISO() } : {}),
                    })
                  }
                  className={`rounded-md border px-1.5 py-0.5 ${
                    task.recurrence === option
                      ? 'border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                      : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  {RECURRENCE_LABEL[option]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <span className="text-slate-400">Notes</span>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={saveNotes}
              placeholder="Add notes…"
              rows={2}
              className="w-full resize-none rounded-md border border-slate-200 bg-transparent px-2 py-1.5 text-xs outline-none transition-colors focus:border-blue-400 dark:border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  )
}
