import { create } from 'zustand'
import { watchAuth } from '../lib/firebase'
import { watchGroups, watchTasks } from '../lib/tasksApi'
import type { Task, TaskGroup } from '../types'

interface TaskStoreState {
  uid: string | null
  authReady: boolean
  groups: TaskGroup[]
  tasks: Task[]
}

export const useTaskStore = create<TaskStoreState>(() => ({
  uid: null,
  authReady: false,
  groups: [],
  tasks: [],
}))

let unsubGroups: (() => void) | null = null
let unsubTasks: (() => void) | null = null

watchAuth((user) => {
  unsubGroups?.()
  unsubTasks?.()

  useTaskStore.setState({ uid: user?.uid ?? null, authReady: true, groups: [], tasks: [] })

  if (user) {
    unsubGroups = watchGroups(user.uid, (groups) => useTaskStore.setState({ groups }))
    unsubTasks = watchTasks(user.uid, (tasks) => useTaskStore.setState({ tasks }))
  }
})
