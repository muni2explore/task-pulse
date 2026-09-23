import { useEffect } from 'react'
import { todayISO } from '../lib/date'
import type { Task, TaskGroup } from '../types'

// Browser notifications only fire while this tab/app is open (no service
// worker push, no server) — see NotificationToggle.tsx for the permission UI
// and CLAUDE.md for why the real background version needs Firebase Cloud
// Messaging + a scheduled Cloud Function instead.
const STORAGE_PREFIX = 'task-pulse-notified-'
const CHECK_INTERVAL_MS = 15 * 60 * 1000

function getNotifiedIds(day: string): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + day)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function markNotified(day: string, ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_PREFIX + day, JSON.stringify([...ids]))
  } catch {
    // ignore — private browsing, storage disabled, etc.
  }
}

// Drop any previous days' "already notified" records so this doesn't grow
// forever — only today's key is ever needed.
function cleanupOldNotifiedKeys(today: string) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX) && key !== STORAGE_PREFIX + today) {
        localStorage.removeItem(key)
      }
    }
  } catch {
    // ignore
  }
}

export function useDueTaskNotifications(tasks: Task[], groups: TaskGroup[]) {
  useEffect(() => {
    cleanupOldNotifiedKeys(todayISO())
  }, [])

  useEffect(() => {
    function check() {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

      const today = todayISO()
      const notified = getNotifiedIds(today)
      const groupById = new Map(groups.map((g) => [g.id, g]))
      let changed = false

      for (const task of tasks) {
        if (task.percent >= 100 || task.dueDate !== today || notified.has(task.id)) continue

        const group = groupById.get(task.groupId)
        const notification = new Notification(task.title, {
          body: group ? `Due today · ${group.name}` : 'Due today',
          tag: task.id,
          icon: '/icon-192.png',
        })
        notification.onclick = () => {
          window.focus()
          notification.close()
        }

        notified.add(task.id)
        changed = true
      }

      if (changed) markNotified(today, notified)
    }

    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [tasks, groups])
}
