import { useState } from 'react'
import { signInWithGoogle, signOutUser } from '../lib/firebase'
import { syncAuthUser, useTaskStore } from '../store/useTaskStore'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4 shrink-0">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  )
}

export function AccountButton() {
  const user = useTaskStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    try {
      const signedInUser = await signInWithGoogle()
      if (signedInUser) syncAuthUser(signedInUser)
    } catch (err) {
      console.error('Google sign-in failed', err)
      setError('Sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (user.isAnonymous) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <GoogleIcon />
          {loading ? 'Signing in…' : 'Sign in with Google'}
        </button>
        {error && <span className="text-xs text-rose-500">{error}</span>}
      </div>
    )
  }

  const initial = (user.displayName ?? user.email ?? '?').slice(0, 1).toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Account menu"
        className="block h-7 w-7 overflow-hidden rounded-full"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {initial}
          </span>
        )}
      </button>

      {menuOpen && (
        <>
          <button
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-9 z-20 w-52 rounded-lg border border-slate-200 bg-white p-1.5 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <p className="truncate px-2 py-1.5 text-xs text-slate-400">
              {user.displayName ?? user.email}
            </p>
            <button
              onClick={() => {
                setMenuOpen(false)
                signOutUser()
              }}
              className="w-full rounded px-2 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
