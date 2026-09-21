import { useMemo } from 'react'
import { GroupItem } from './components/GroupItem'
import { NewGroupButton } from './components/NewGroupButton'
import { firebaseConfigured } from './lib/firebase'
import { useTaskStore } from './store/useTaskStore'

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

  const tasksByGroup = useMemo(() => {
    const map = new Map<string, typeof tasks>()
    for (const task of tasks) {
      const list = map.get(task.groupId) ?? []
      list.push(task)
      map.set(task.groupId, list)
    }
    return map
  }, [tasks])

  const overall = useMemo(() => {
    if (tasks.length === 0) return 0
    return Math.round(tasks.reduce((sum, t) => sum + t.percent, 0) / tasks.length)
  }, [tasks])

  return (
    <div className="min-h-svh">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold">Task Pulse</h1>
          {tasks.length > 0 && (
            <span className="text-sm text-slate-400">{overall}% done overall</span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-4 py-6">
        {!firebaseConfigured ? (
          <ConfigWarning />
        ) : !authReady || !uid ? (
          <p className="text-center text-sm text-slate-400">Loading…</p>
        ) : (
          <>
            {groups.map((group) => (
              <GroupItem
                key={group.id}
                uid={uid}
                group={group}
                tasks={tasksByGroup.get(group.id) ?? []}
              />
            ))}
            <NewGroupButton uid={uid} nextOrder={groups.length} />
          </>
        )}
      </main>
    </div>
  )
}

export default App
