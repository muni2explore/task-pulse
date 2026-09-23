import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemo, useState } from 'react'
import { AccountButton } from './components/AccountButton'
import { AnalyticsBar } from './components/AnalyticsBar'
import { CompletedView } from './components/CompletedView'
import { NewGroupButton } from './components/NewGroupButton'
import { NotificationToggle } from './components/NotificationToggle'
import { OfflineBanner } from './components/OfflineBanner'
import { SearchFilterBar } from './components/SearchFilterBar'
import { SelectionBar } from './components/SelectionBar'
import { SortableGroupItem } from './components/SortableGroupItem'
import { ThemeToggle } from './components/ThemeToggle'
import { ToastContainer } from './components/ToastContainer'
import { TodayView } from './components/TodayView'
import { useDndSensors } from './hooks/useDndSensors'
import { useDueTaskNotifications } from './hooks/useDueTaskNotifications'
import { computeStats } from './lib/analytics'
import { firebaseConfigured } from './lib/firebase'
import {
  bulkDeleteTasks,
  bulkSetPercent,
  reorderGroups,
  restoreTasks,
  setAllGroupsCollapsed,
  spawnNextOccurrence,
} from './lib/tasksApi'
import { useTaskStore } from './store/useTaskStore'
import { useToastStore } from './store/useToastStore'
import type { Priority } from './types'

type View = 'groups' | 'today' | 'completed'

function ConfigWarning() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
      <p className="font-semibold">Firebase isn't configured yet.</p>
      <p className="mt-2">
        Copy <code className="rounded bg-black/10 px-1">.env.example</code> to{' '}
        <code className="rounded bg-black/10 px-1">.env</code> and fill in your Firebase project
        keys, then restart <code className="rounded bg-black/10 px-1">npm run dev</code>.
      </p>
    </div>
  )
}

function App() {
  const uid = useTaskStore((s) => s.uid)
  const authReady = useTaskStore((s) => s.authReady)
  const groups = useTaskStore((s) => s.groups)
  const tasks = useTaskStore((s) => s.tasks)
  const sensors = useDndSensors()

  const [view, setView] = useState<View>('groups')
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const pushToast = useToastStore((s) => s.push)

  const filtersActive = query.trim() !== '' || priorityFilter !== 'all'

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks.filter((t) => {
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (q && !t.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [tasks, query, priorityFilter])

  const tasksByGroup = useMemo(() => {
    const map = new Map<string, typeof tasks>()
    for (const task of filteredTasks) {
      const list = map.get(task.groupId) ?? []
      list.push(task)
      map.set(task.groupId, list)
    }
    return map
  }, [filteredTasks])

  const visibleGroups = useMemo(() => {
    if (!filtersActive) return groups
    return groups.filter((g) => (tasksByGroup.get(g.id) ?? []).length > 0)
  }, [groups, filtersActive, tasksByGroup])

  const stats = useMemo(() => computeStats(tasks), [tasks])
  const allCollapsed = groups.length > 0 && groups.every((g) => g.collapsed)

  useDueTaskNotifications(tasks, groups)

  function handleGroupDragEnd(event: DragEndEvent) {
    if (!uid) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = groups.findIndex((g) => g.id === active.id)
    const newIndex = groups.findIndex((g) => g.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    reorderGroups(uid, arrayMove(groups, oldIndex, newIndex).map((g) => g.id))
  }

  function toggleSelect(taskId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  function handleToggleSelectMode() {
    setSelectMode((v) => !v)
    setSelectedIds(new Set())
  }

  function handleBulkComplete() {
    if (!uid || selectedIds.size === 0) return
    const ids = [...selectedIds]
    const toComplete = tasks.filter((t) => selectedIds.has(t.id) && t.percent < 100)
    bulkSetPercent(uid, ids, 100)
    toComplete.forEach((task) => {
      if (task.recurrence !== 'none') spawnNextOccurrence(uid, task)
    })
    setSelectedIds(new Set())
    setSelectMode(false)
  }

  function handleBulkDelete() {
    if (!uid || selectedIds.size === 0) return
    const ids = [...selectedIds]
    const toDelete = tasks.filter((t) => selectedIds.has(t.id))
    bulkDeleteTasks(uid, ids)
    pushToast({
      message: `Deleted ${toDelete.length} task${toDelete.length === 1 ? '' : 's'}`,
      actionLabel: 'Undo',
      onAction: () => restoreTasks(uid, toDelete),
    })
    setSelectedIds(new Set())
    setSelectMode(false)
  }

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white shadow-sm shadow-blue-500/30">
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path
                  d="M5 10.5l2.5 2.5 4-5.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <h1 className="text-lg font-semibold tracking-tight">Task Pulse</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationToggle />
            <ThemeToggle />
            <AccountButton />
          </div>
        </div>
        <div className="mx-auto flex max-w-2xl gap-1 px-4 pb-3">
          {(['groups', 'today', 'completed'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition-colors ${
                view === v
                  ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      <OfflineBanner />

      <main className="mx-auto max-w-2xl space-y-3 px-4 py-6">
        {!firebaseConfigured ? (
          <ConfigWarning />
        ) : !authReady || !uid ? (
          <div className="flex justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500 dark:border-slate-700 dark:border-t-blue-400" />
          </div>
        ) : (
          <>
            {tasks.length > 0 && <AnalyticsBar stats={stats} />}

            <SearchFilterBar
              query={query}
              onQueryChange={setQuery}
              priority={priorityFilter}
              onPriorityChange={setPriorityFilter}
            />

            <SelectionBar
              selectMode={selectMode}
              selectedCount={selectedIds.size}
              onToggleSelectMode={handleToggleSelectMode}
              onBulkComplete={handleBulkComplete}
              onBulkDelete={handleBulkDelete}
            />

            {view === 'today' ? (
              <TodayView
                uid={uid}
                tasks={filteredTasks}
                groups={groups}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            ) : view === 'completed' ? (
              <CompletedView
                uid={uid}
                tasks={filteredTasks}
                groups={groups}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            ) : (
              <>
                {groups.length === 0 ? (
                  <p className="px-1 text-sm text-slate-400">
                    No task groups yet — create one below to start adding tasks.
                  </p>
                ) : (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setAllGroupsCollapsed(uid, groups.map((g) => g.id), !allCollapsed)}
                      className="flex items-center gap-1 px-1 py-1 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`h-3 w-3 transition-transform ${allCollapsed ? '-rotate-90' : ''}`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {allCollapsed ? 'Expand all' : 'Collapse all'}
                    </button>
                  </div>
                )}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
                  <SortableContext items={visibleGroups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {visibleGroups.map((group) => (
                        <SortableGroupItem
                          key={group.id}
                          uid={uid}
                          group={group}
                          tasks={tasksByGroup.get(group.id) ?? []}
                          dragDisabled={filtersActive || selectMode}
                          selectMode={selectMode}
                          selectedIds={selectedIds}
                          onToggleSelect={toggleSelect}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <NewGroupButton uid={uid} nextOrder={groups.length} />
              </>
            )}
          </>
        )}
      </main>

      <ToastContainer />
    </div>
  )
}

export default App
