# Task Pulse

A daily task manager: collapsible task groups, per-task percent-complete, and
adding tasks by text or voice. Built with React + TypeScript + Vite +
Tailwind CSS, backed by Firebase (Firestore + Auth) for offline-first storage
that syncs across devices.

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your Firebase project's web config (Firebase console →
Project settings → General → Your apps). You'll also need to, in the
Firebase console:

1. **Authentication → Sign-in method**: enable the **Anonymous** provider
   (the app signs users in anonymously so it works instantly with no signup).
2. **Firestore Database**: create a database, then deploy the rules in this
   repo so each user can only read/write their own data:
   ```bash
   npx firebase-tools deploy --only firestore:rules
   ```

## Commands

```bash
npm run dev      # start the dev server
npm run build    # typecheck (tsc -b) and build for production
npm run lint     # oxlint
npm run preview  # preview the production build locally
```

To develop against the [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
instead of a real project (no cloud project needed):

```bash
npx firebase-tools emulators:start --only firestore,auth
```

and set `VITE_USE_FIREBASE_EMULATOR=true` in `.env.local`.

## Architecture

- `src/lib/firebase.ts` — Firebase app/auth/Firestore init. Firestore uses
  `persistentLocalCache` so the app works offline and syncs automatically
  when back online. Initialization is guarded behind `firebaseConfigured` so
  a missing `.env` fails gracefully in the UI instead of crashing.
- `src/lib/tasksApi.ts` — all Firestore reads/writes (groups and tasks live
  in flat `users/{uid}/groups` and `users/{uid}/tasks` collections, tasks
  reference their group by `groupId`).
- `src/store/useTaskStore.ts` — a Zustand store that subscribes to Firebase
  auth state and, once signed in, to real-time Firestore listeners for
  groups and tasks. Components read from this store; writes go straight
  through `tasksApi` (no local reducer — Firestore's real-time listener is
  the source of truth, including for the local optimistic-write case).
- `src/hooks/useVoiceInput.ts` — thin wrapper around the browser's Web
  Speech API (`SpeechRecognition`), used by `AddTaskInput` for voice-to-text.
- `src/components/AddTaskInput.tsx` — quick-add parser: strips `!high` /
  `!medium` / `!low` tags out of the typed or transcribed text to set
  priority on submit.

## Firestore data model

```
users/{uid}/groups/{groupId}   { name, color, order, collapsed, createdAt }
users/{uid}/tasks/{taskId}     { groupId, title, notes, percent, priority,
                                  dueDate, order, createdAt, updatedAt }
```

`firestore.rules` restricts all reads/writes to `request.auth.uid == uid`.
