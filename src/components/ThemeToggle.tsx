import type { ReactNode } from 'react'
import { type Theme, useTheme } from '../hooks/useTheme'

const NEXT: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' }

const ICONS: Record<Theme, ReactNode> = {
  light: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 2.78a1 1 0 011.41 1.41l-.7.71a1 1 0 11-1.42-1.42l.71-.7zM17 9a1 1 0 110 2h-1a1 1 0 110-2h1zM4 9a1 1 0 110 2H3a1 1 0 110-2h1zm11.31 5.31a1 1 0 011.42 1.42l-.71.7a1 1 0 01-1.41-1.41l.7-.71zM6.11 4.19a1 1 0 011.41 1.41l-.7.71A1 1 0 015.4 4.9l.71-.71zM10 6a4 4 0 100 8 4 4 0 000-8zM3.98 14.31a1 1 0 011.41-1.42l.71.71a1 1 0 01-1.41 1.42l-.71-.71zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" />
    </svg>
  ),
  dark: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  ),
  system: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M2 4.75A2.75 2.75 0 014.75 2h10.5A2.75 2.75 0 0118 4.75v7.5A2.75 2.75 0 0115.25 15H11l.5 2h1.25a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5H6.5l.5-2H4.75A2.75 2.75 0 012 12.25v-7.5zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v7.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-7.5c0-.69-.56-1.25-1.25-1.25H4.75z"
        clipRule="evenodd"
      />
    </svg>
  ),
}

const LABELS: Record<Theme, string> = { light: 'Light', dark: 'Dark', system: 'Auto' }

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(NEXT[theme])}
      title={`Theme: ${LABELS[theme]} (click to change)`}
      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
    >
      {ICONS[theme]}
    </button>
  )
}
