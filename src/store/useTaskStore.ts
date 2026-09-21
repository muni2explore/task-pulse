import type { User } from 'firebase/auth'
import { create } from 'zustand'
import { watchAuth } from '../lib/firebase'
import { watchGroups, watchTasks } from '../lib/tasksApi'
import type { Task, TaskGroup } from '../types'

export interface AuthUser {
  uid: string
  isAnonymous: boolean
  displayName: string | null
  email: string | null
  photoURL: string | null
}

interface TaskStoreState {
  uid: string | null
  user: AuthUser | null
  authReady: boolean
  groups: TaskGroup[]
  tasks: Task[]
}

export const useTaskStore = create<TaskStoreState>(() => ({
  uid: null,
  user: null,
  authReady: false,
  groups: [],
  tasks: [],
}))

let unsubGroups: (() => void) | null = null
let unsubTasks: (() => void) | null = null
let lastUid: string | null = null

function applyAuthUser(firebaseUser: User | null) {
  const user: AuthUser | null = firebaseUser
    ? {
        uid: firebaseUser.uid,
        isAnonymous: firebaseUser.isAnonymous,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
      }
    : null

  // Same uid as before — e.g. an anonymous user just linked Google to their
  // existing account. Just refresh the profile fields; no need to redo the
  // Firestore subscriptions (they're already scoped to this uid).
  if (user && user.uid === lastUid) {
    useTaskStore.setState({ user })
    return
  }

  unsubGroups?.()
  unsubTasks?.()
  lastUid = user?.uid ?? null

  useTaskStore.setState({ uid: user?.uid ?? null, user, authReady: true, groups: [], tasks: [] })

  if (user) {
    unsubGroups = watchGroups(user.uid, (groups) => useTaskStore.setState({ groups }))
    unsubTasks = watchTasks(user.uid, (tasks) => useTaskStore.setState({ tasks }))
  }
}

watchAuth(applyAuthUser)

// Firebase's onAuthStateChanged is not guaranteed to re-fire after an
// in-place account upgrade (e.g. linking Google to an anonymous session, see
// signInWithGoogle) — call this with the result so the UI updates regardless.
export function syncAuthUser(firebaseUser: User) {
  applyAuthUser(firebaseUser)
}
