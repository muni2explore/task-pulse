import { useState } from 'react'
import { useVoiceInput } from '../hooks/useVoiceInput'
import { createTask } from '../lib/tasksApi'
import type { Priority } from '../types'

const PRIORITY_TAGS: Record<string, Priority> = {
  '!high': 'high',
  '!low': 'low',
  '!medium': 'medium',
}

function parseQuickAdd(raw: string): { title: string; priority: Priority } {
  let priority: Priority = 'medium'
  const title = raw
    .split(/\s+/)
    .filter((word) => {
      const tag = PRIORITY_TAGS[word.toLowerCase()]
      if (tag) {
        priority = tag
        return false
      }
      return true
    })
    .join(' ')
    .trim()
  return { title, priority }
}

interface AddTaskInputProps {
  uid: string
  groupId: string
  nextOrder: number
}

export function AddTaskInput({ uid, groupId, nextOrder }: AddTaskInputProps) {
  const [value, setValue] = useState('')
  const [pendingVoice, setPendingVoice] = useState<string | null>(null)

  const voice = useVoiceInput((transcript) => {
    setValue(transcript)
    setPendingVoice(transcript)
  })

  function submit(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const { title, priority } = parseQuickAdd(trimmed)
    if (!title) return
    createTask(uid, { groupId, title, order: nextOrder, priority })
    setValue('')
    setPendingVoice(null)
  }

  return (
    <div className="mt-1">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(value)
        }}
        className="flex items-center gap-2"
      >
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setPendingVoice(null)
          }}
          placeholder="Add a task… (try !high for priority)"
          className="flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-slate-400 dark:border-slate-700"
        />
        {voice.supported && (
          <button
            type="button"
            onClick={() => (voice.listening ? voice.stop() : voice.start())}
            aria-label={voice.listening ? 'Stop recording' : 'Add task by voice'}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
              voice.listening
                ? 'animate-pulse border-rose-400 bg-rose-50 text-rose-500 dark:bg-rose-950'
                : 'border-slate-200 text-slate-400 hover:text-slate-600 dark:border-slate-700'
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10 12.5a3 3 0 003-3v-4a3 3 0 10-6 0v4a3 3 0 003 3z" />
              <path d="M5.5 9.5a.75.75 0 00-1.5 0 6 6 0 005.25 5.95v1.55h-2a.75.75 0 000 1.5h5.5a.75.75 0 000-1.5h-2v-1.55A6 6 0 0016 9.5a.75.75 0 00-1.5 0 4.5 4.5 0 01-9 0z" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
          disabled={!value.trim()}
        >
          Add
        </button>
      </form>
      {pendingVoice && (
        <p className="mt-1 pl-1 text-xs text-slate-400">
          Heard: "{pendingVoice}" — edit if needed, then press Add.
        </p>
      )}
    </div>
  )
}
