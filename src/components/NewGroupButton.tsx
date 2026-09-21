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
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 py-3 text-sm text-slate-400 transition-colors hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-500 dark:border-slate-700 dark:hover:border-blue-800 dark:hover:bg-blue-500/5 dark:hover:text-blue-400"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M10 4a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 0110 4z" />
        </svg>
        New group
      </button>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="flex items-center gap-2 rounded-2xl border border-blue-300 bg-blue-50/40 p-3 dark:border-blue-800 dark:bg-blue-500/5"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={submit}
        placeholder="Group name (e.g. Work, Home)"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
      />
      <button type="submit" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
        Add
      </button>
    </form>
  )
}
