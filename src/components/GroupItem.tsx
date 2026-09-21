import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { HTMLAttributes } from 'react'
import { useMemo, useState } from 'react'
import { useDndSensors } from '../hooks/useDndSensors'
import { deleteGroup, renameGroup, reorderTasks, setGroupCollapsed } from '../lib/tasksApi'
import type { Task, TaskGroup } from '../types'
import { AddTaskInput } from './AddTaskInput'
import { ProgressBar } from './ProgressBar'
import { SortableTaskItem } from './SortableTaskItem'

interface GroupItemProps {
  uid: string
  group: TaskGroup
  tasks: Task[]
  reorderEnabled?: boolean
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>
}

export function GroupItem({ uid, group, tasks, reorderEnabled = true, dragHandleProps }: GroupItemProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(group.name)
  const sensors = useDndSensors()

  const { doneCount, avgPercent } = useMemo(() => {
    if (tasks.length === 0) return { doneCount: 0, avgPercent: 0 }
    const done = tasks.filter((t) => t.percent >= 100).length
    const avg = Math.round(tasks.reduce((sum, t) => sum + t.percent, 0) / tasks.length)
    return { doneCount: done, avgPercent: avg }
  }, [tasks])

  const nextOrder = tasks.length ? Math.max(...tasks.map((t) => t.order)) + 1 : 0

  function commitName() {
    const trimmed = name.trim()
    setEditing(false)
    if (trimmed && trimmed !== group.name) renameGroup(uid, group.id, trimmed)
    else setName(group.name)
  }

  function handleTaskDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = tasks.findIndex((t) => t.id === active.id)
    const newIndex = tasks.findIndex((t) => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    reorderTasks(uid, arrayMove(tasks, oldIndex, newIndex).map((t) => t.id))
  }

  return (
    <section className="group rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 px-4 py-3.5">
        {dragHandleProps && (
          <button
            {...dragHandleProps}
            aria-label="Drag to reorder group"
            className="shrink-0 cursor-grab touch-none text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M7 4a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm5-12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
            </svg>
          </button>
        )}

        <button
          onClick={() => setGroupCollapsed(uid, group.id, !group.collapsed)}
          aria-label={group.collapsed ? 'Expand group' : 'Collapse group'}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 transition-transform ${group.collapsed ? '-rotate-90' : ''}`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <span
          className="h-3 w-3 shrink-0 rounded-full ring-4"
          style={{ backgroundColor: group.color, boxShadow: `0 0 0 3px ${group.color}22` }}
        />

        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === 'Enter' && commitName()}
            className="flex-1 border-b border-blue-400 bg-transparent text-[15px] font-semibold outline-none"
          />
        ) : (
          <button
            className="flex-1 truncate text-left text-[15px] font-semibold"
            onClick={() => setEditing(true)}
          >
            {group.name}
          </button>
        )}

        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {doneCount}/{tasks.length} · {avgPercent}%
        </span>

        <button
          onClick={() => {
            if (tasks.length === 0 || confirm(`Delete "${group.name}" and its ${tasks.length} task(s)?`)) {
              deleteGroup(uid, group.id)
            }
          }}
          aria-label="Delete group"
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

      <div className="px-4 pb-2">
        <ProgressBar percent={avgPercent} color={group.color} />
      </div>

      {!group.collapsed && (
        <div className="space-y-2 px-4 pb-4 pt-3">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTaskDragEnd}>
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-1.5">
                {tasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    uid={uid}
                    task={task}
                    color={group.color}
                    dragDisabled={!reorderEnabled}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <AddTaskInput uid={uid} groupId={group.id} nextOrder={nextOrder} />
        </div>
      )}
    </section>
  )
}
