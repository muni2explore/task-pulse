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
import type { Priority, Task, TaskGroup } from '../types'

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
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task))
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
  },
) {
  return addDoc(tasksRef(uid), {
    groupId: input.groupId,
    title: input.title,
    notes: input.notes ?? '',
    percent: 0,
    priority: input.priority ?? 'medium',
    dueDate: input.dueDate ?? null,
    order: input.order,
    createdAt: Date.now(),
    updatedAt: serverTimestamp(),
  })
}

export function setTaskPercent(uid: string, taskId: string, percent: number) {
  return updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
    percent: Math.max(0, Math.min(100, percent)),
    updatedAt: serverTimestamp(),
  })
}

export function updateTask(
  uid: string,
  taskId: string,
  patch: Partial<Pick<Task, 'title' | 'notes' | 'priority' | 'dueDate' | 'groupId'>>,
) {
  return updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
    ...patch,
    updatedAt: serverTimestamp(),
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
