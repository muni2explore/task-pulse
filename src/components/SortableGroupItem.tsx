import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task, TaskGroup } from '../types'
import { GroupItem } from './GroupItem'

interface SortableGroupItemProps {
  uid: string
  group: TaskGroup
  tasks: Task[]
  dragDisabled: boolean
}

export function SortableGroupItem({ uid, group, tasks, dragDisabled }: SortableGroupItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
    disabled: dragDisabled,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'relative z-10 opacity-60' : ''}
    >
      <GroupItem
        uid={uid}
        group={group}
        tasks={tasks}
        reorderEnabled={!dragDisabled}
        dragHandleProps={dragDisabled ? undefined : { ...attributes, ...listeners }}
      />
    </div>
  )
}
