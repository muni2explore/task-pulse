import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../types'
import { TaskItem } from './TaskItem'

interface SortableTaskItemProps {
  uid: string
  task: Task
  color: string
  dragDisabled: boolean
  groupName?: string
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

export function SortableTaskItem({
  uid,
  task,
  color,
  dragDisabled,
  groupName,
  selectMode,
  selected,
  onToggleSelect,
}: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: dragDisabled,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'relative z-10 opacity-60' : ''}
    >
      <TaskItem
        uid={uid}
        task={task}
        color={color}
        groupName={groupName}
        dragHandleProps={dragDisabled ? undefined : { ...attributes, ...listeners }}
        selectMode={selectMode}
        selected={selected}
        onToggleSelect={onToggleSelect}
      />
    </li>
  )
}
