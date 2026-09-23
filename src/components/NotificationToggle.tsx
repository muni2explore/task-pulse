import { useState } from 'react'

type PermissionState = NotificationPermission | 'unsupported'

function getPermission(): PermissionState {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

export function NotificationToggle() {
  const [permission, setPermission] = useState<PermissionState>(getPermission)

  if (permission === 'unsupported') return null

  async function handleClick() {
    if (permission !== 'default') return
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  const title =
    permission === 'granted'
      ? 'Reminders for tasks due today are on'
      : permission === 'denied'
        ? "Notifications blocked — enable them in your browser's site settings to get due-today reminders"
        : 'Turn on reminders for tasks due today'

  return (
    <button
      onClick={handleClick}
      title={title}
      aria-label={title}
      className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
        permission === 'denied'
          ? 'cursor-default text-slate-300 dark:text-slate-600'
          : permission === 'granted'
            ? 'text-blue-500 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800'
      }`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10 2a4 4 0 00-4 4v2.5c0 .9-.35 1.77-.98 2.42L4.2 12.2c-.6.62-.16 1.68.7 1.68h10.2c.86 0 1.3-1.06.7-1.68l-.82-1.28A3.5 3.5 0 0114 8.5V6a4 4 0 00-4-4z" />
        <path d="M8.03 16a2 2 0 003.94 0h-3.94z" />
      </svg>
      {permission === 'denied' && (
        <svg viewBox="0 0 20 20" className="absolute h-4 w-4" fill="none">
          <path d="M4 4l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}
