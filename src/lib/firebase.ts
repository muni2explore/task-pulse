import {
  type Auth,
  type User,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
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
