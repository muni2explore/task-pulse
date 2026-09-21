export type Priority = 'low' | 'medium' | 'high'

export interface TaskGroup {
  id: string
  name: string
  color: string
  order: number
  collapsed: boolean
  createdAt: number
}

export interface Task {
  id: string
  groupId: string
  title: string
  notes: string
  percent: number
  priority: Priority
  dueDate: string | null
  order: number
  createdAt: number
  updatedAt: number
}

export const GROUP_COLORS = [
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
]
