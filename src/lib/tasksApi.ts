import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { addDaysISO } from './date'
import type { Priority, Recurrence, Task, TaskGroup } from '../types'

const groupsRef = (uid: string) => collection(db, 'users', uid, 'groups')
const tasksRef = (uid: string) => collection(db, 'users', uid, 'tasks')

export function watchGroups(uid: string, onChange: (groups: TaskGroup[]) => void) {
  const q = query(groupsRef(uid), orderBy('order', 'asc'))
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TaskGroup))
  })
}

export function watchTasks(uid: string, onChange: (tasks: Task[]) => void) {
  const q = query(tasksRef(uid), orderBy('order', 'asc'))
  return onSnapshot(q, (snap) => {
    onChange(
      snap.docs.map((d) => {
        const data = d.data()
        // Default fields added after some tasks were already created, so
        // older docs won't have them — normalize here rather than scattering
        // `?? fallback` checks through every consumer.
        return {
          id: d.id,
          ...data,
          completedAt: data.completedAt ?? null,
          recurrence: data.recurrence ?? 'none',
        } as Task
      }),
    )
  })
}

export function createGroup(uid: string, name: string, color: string, order: number) {
  return addDoc(groupsRef(uid), {
    name,
    color,
    order,
    collapsed: false,
    createdAt: Date.now(),
  })
}

export function renameGroup(uid: string, groupId: string, name: string) {
  return updateDoc(doc(db, 'users', uid, 'groups', groupId), { name })
}

export function setGroupCollapsed(uid: string, groupId: string, collapsed: boolean) {
  return updateDoc(doc(db, 'users', uid, 'groups', groupId), { collapsed })
}

export function setAllGroupsCollapsed(uid: string, groupIds: string[], collapsed: boolean) {
  const batch = writeBatch(db)
  groupIds.forEach((id) => {
    batch.update(doc(db, 'users', uid, 'groups', id), { collapsed })
  })
  return batch.commit()
}

export function reorderGroups(uid: string, orderedIds: string[]) {
  const batch = writeBatch(db)
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, 'users', uid, 'groups', id), { order: index })
  })
  return batch.commit()
}

// Deletes the group and every task inside it (tasks reference groups by id
// only, so without this they'd be orphaned — invisible but still stored).
export async function deleteGroup(uid: string, groupId: string) {
  const batch = writeBatch(db)
  const taskDocs = await getDocs(query(tasksRef(uid), where('groupId', '==', groupId)))
  taskDocs.forEach((d) => batch.delete(d.ref))
  batch.delete(doc(db, 'users', uid, 'groups', groupId))
  return batch.commit()
}

export function createTask(
  uid: string,
  input: {
    groupId: string
    title: string
    order: number
    priority?: Priority
    dueDate?: string | null
    notes?: string
    recurrence?: Recurrence
  },
) {
  return addDoc(tasksRef(uid), {
    groupId: input.groupId,
    title: input.title,
    notes: input.notes ?? '',
    percent: 0,
    priority: input.priority ?? 'medium',
    dueDate: input.dueDate ?? null,
    recurrence: input.recurrence ?? 'none',
    completedAt: null,
    order: input.order,
    createdAt: Date.now(),
    updatedAt: serverTimestamp(),
  })
}

export function setTaskPercent(uid: string, taskId: string, percent: number) {
  const clamped = Math.max(0, Math.min(100, percent))
  return updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
    percent: clamped,
    completedAt: clamped >= 100 ? Date.now() : null,
    updatedAt: serverTimestamp(),
  })
}

export function updateTask(
  uid: string,
  taskId: string,
  patch: Partial<Pick<Task, 'title' | 'notes' | 'priority' | 'dueDate' | 'groupId' | 'recurrence'>>,
) {
  return updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
    ...patch,
    updatedAt: serverTimestamp(),
  })
}

function nextRecurrenceDate(recurrence: Recurrence): string {
  if (recurrence === 'weekly') return addDaysISO(7)
  if (recurrence === 'weekdays') {
    let offset = 1
    let day = new Date(Date.now() + offset * 86_400_000).getDay()
    while (day === 0 || day === 6) {
      offset++
      day = new Date(Date.now() + offset * 86_400_000).getDay()
    }
    return addDaysISO(offset)
  }
  return addDaysISO(1) // 'daily'
}

// Called when a recurring task is completed: creates the next occurrence
// dated from today (the completion date), not the old due date — so a task
// finished late doesn't drag every future occurrence's date along with it.
export function spawnNextOccurrence(uid: string, task: Task) {
  if (task.recurrence === 'none') return
  return createTask(uid, {
    groupId: task.groupId,
    title: task.title,
    order: task.order,
    priority: task.priority,
    notes: task.notes,
    recurrence: task.recurrence,
    dueDate: nextRecurrenceDate(task.recurrence),
  })
}

export function reorderTasks(uid: string, orderedIds: string[]) {
  const batch = writeBatch(db)
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, 'users', uid, 'tasks', id), { order: index })
  })
  return batch.commit()
}

export function deleteTask(uid: string, taskId: string) {
  return deleteDoc(doc(db, 'users', uid, 'tasks', taskId))
}

// Recreates a task with its original id/fields, for an "Undo" toast after delete.
export function restoreTask(uid: string, task: Task) {
  const { id, ...fields } = task
  return setDoc(doc(db, 'users', uid, 'tasks', id), fields)
}

export function bulkSetPercent(uid: string, taskIds: string[], percent: number) {
  const clamped = Math.max(0, Math.min(100, percent))
  const batch = writeBatch(db)
  taskIds.forEach((id) => {
    batch.update(doc(db, 'users', uid, 'tasks', id), {
      percent: clamped,
      completedAt: clamped >= 100 ? Date.now() : null,
      updatedAt: serverTimestamp(),
    })
  })
  return batch.commit()
}

export function bulkDeleteTasks(uid: string, taskIds: string[]) {
  const batch = writeBatch(db)
  taskIds.forEach((id) => {
    batch.delete(doc(db, 'users', uid, 'tasks', id))
  })
  return batch.commit()
}

// Recreates several tasks with their original ids/fields, for an "Undo"
// toast after a bulk delete.
export function restoreTasks(uid: string, tasks: Task[]) {
  const batch = writeBatch(db)
  tasks.forEach((task) => {
    const { id, ...fields } = task
    batch.set(doc(db, 'users', uid, 'tasks', id), fields)
  })
  return batch.commit()
}
