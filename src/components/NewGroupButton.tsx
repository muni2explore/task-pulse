import { useState } from 'react'
import { createGroup } from '../lib/tasksApi'
import { GROUP_COLORS } from '../types'

interface NewGroupButtonProps {
  uid: string
  nextOrder: number
}

export function NewGroupButton({ uid, nextOrder }: NewGroupButtonProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  function submit() {
    const trimmed = name.trim()
    if (trimmed) {
      const color = GROUP_COLORS[nextOrder % GROUP_COLORS.length]
      createGroup(uid, trimmed, color, nextOrder)
    }
    setName('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-slate-300 py-3 text-sm text-slate-400 hover:border-slate-400 hover:text-slate-600 dark:border-slate-700"
      >
        + New group
      </button>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="flex items-center gap-2 rounded-xl border border-slate-300 p-3 dark:border-slate-700"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={submit}
        placeholder="Group name (e.g. Work, Home)"
        className="flex-1 bg-transparent text-sm outline-none"
      />
      <button type="submit" className="text-sm font-medium text-slate-900 dark:text-slate-100">
        Add
      </button>
    </form>
  )
}
