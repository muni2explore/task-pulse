import {
  type Auth,
  type User,
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { type FirebaseApp, getApps, initializeApp } from 'firebase/app'
import {
  type Firestore,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

// Local dev against the Firebase Emulator Suite (`firebase emulators:start`)
// needs no real project — just a placeholder config and USE_EMULATOR=true.
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'

const firebaseConfig = useEmulator
  ? {
      apiKey: 'demo-api-key',
      authDomain: 'localhost',
      projectId: 'demo-task-pulse',
    }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }

export const firebaseConfigured = useEmulator || Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

let app: FirebaseApp | null = null
let dbInstance: Firestore | null = null
let authInstance: Auth | null = null

// Guard initialization: an invalid/missing API key throws synchronously, so
// only touch the Firebase SDK once real config is present (see .env.example).
if (firebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

  if (useEmulator) {
    // Emulator has no persistent-cache backing store; plain memory cache is fine.
    dbInstance = initializeFirestore(app, {})
    connectFirestoreEmulator(dbInstance, 'localhost', 8080)
    authInstance = getAuth(app)
    connectAuthEmulator(authInstance, 'http://localhost:9099', { disableWarnings: true })
  } else {
    // Offline-first: Firestore caches reads/writes locally and syncs
    // automatically once the connection comes back, across open tabs.
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
    authInstance = getAuth(app)
  }
}

export const db = dbInstance as Firestore
export const auth = authInstance as Auth

export function watchAuth(callback: (user: User | null) => void) {
  if (!authInstance) return () => {}

  return onAuthStateChanged(authInstance, (user) => {
    if (user) {
      callback(user)
    } else {
      signInAnonymously(authInstance!).catch((error) => {
        console.error('Anonymous sign-in failed', error)
        callback(null)
      })
    }
  })
}

const googleProvider = new GoogleAuthProvider()

// If the current user is anonymous, upgrade that same account (and its data)
// to Google sign-in via linking, rather than swapping to a fresh account.
// Returns the resulting user: linking updates the *same* Firebase user object
// in place (same uid) rather than firing a sign-in/out event, so
// onAuthStateChanged is not guaranteed to re-fire — callers must push this
// result into app state themselves instead of waiting on the listener.
export async function signInWithGoogle(): Promise<User | undefined> {
  if (!authInstance) return
  const current = authInstance.currentUser

  if (current?.isAnonymous) {
    try {
      const result = await linkWithPopup(current, googleProvider)
      return result.user
    } catch (error) {
      // That Google account is already tied to a different (non-anonymous)
      // account — fall through and sign into that existing account instead.
      if ((error as { code?: string }).code !== 'auth/credential-already-in-use') throw error
    }
  }

  const result = await signInWithPopup(authInstance, googleProvider)
  return result.user
}

export function signOutUser() {
  if (!authInstance) return Promise.resolve()
  return signOut(authInstance)
}
