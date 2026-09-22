# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Task Pulse: a daily task manager with collapsible task groups, per-task percent-complete, drag-and-drop reordering, a "Today" cross-group view, and adding tasks by text or voice. React + TypeScript + Vite + Tailwind CSS, backed by Firebase (Firestore + Auth) for offline-first storage that syncs across devices. No backend server — it's a static SPA that talks to Firestore directly from the client.

## Commands

```bash
npm run dev      # start the dev server
npm run build    # typecheck (tsc -b) and build for production
npm run lint     # oxlint
npm run preview  # preview the production build locally
```

There is no test suite configured.

### Local Firebase setup

`.env` needs a real Firebase project's web config (see `.env.example`). To develop without a real project, run the emulator suite and point the app at it instead:

```bash
npx firebase-tools emulators:start --only firestore,auth --project demo-task-pulse
```

with `VITE_USE_FIREBASE_EMULATOR=true` in `.env.local` (this is intentionally a *separate* file from `.env` so real prod credentials are never overwritten). `src/lib/firebase.ts` switches to a placeholder `demo-task-pulse` config and connects to `localhost:8080`/`:9099` when that flag is set.

In the real Firebase project, **Authentication → Sign-in method** needs both **Anonymous** and **Google** enabled, and any custom deploy domain must be added under **Authentication → Settings → Authorized domains** or Google sign-in fails with `auth/unauthorized-domain`. Firestore rules (`firestore.rules`, restricting all access to `request.auth.uid == uid`) deploy with:

```bash
npx firebase-tools deploy --only firestore:rules --project <project-id>
```

### Deployment

No CI/CD — deploys are manual, straight to a static host on a shared server (`pulse.hellomagi.in`, nginx-served from `/var/www/smarttut/pulse.hellomagi.in/`, wildcard TLS cert already covers the subdomain). To ship a change:

```bash
npm run build
rsync -avz --delete -e "ssh -i <key> -p 2222" dist/ ubuntu@<host>:/var/www/smarttut/pulse.hellomagi.in/
ssh -i <key> -p 2222 ubuntu@<host> "chmod -R a+rX /var/www/smarttut/pulse.hellomagi.in"
```

`--delete` matters: Vite content-hashes asset filenames, so without it stale JS/CSS from previous builds accumulates on the server. The `chmod` matters too: nginx runs as `www-data` and the uploaded files are `ubuntu`-owned, so they need to stay world-readable. Because the app is a PWA with a service worker, a browser that already had the site open may need one extra manual refresh after a deploy to pick up the new build — the service worker updates in the background but doesn't take over mid-session.

## Architecture

### State flow

Firestore is the single source of truth; there's no local reducer or optimistic-update layer. `src/store/useTaskStore.ts` subscribes to Firebase auth state and, once signed in, opens real-time Firestore listeners (`watchGroups`/`watchTasks` in `src/lib/tasksApi.ts`) that push straight into a Zustand store. Components read from that store; every write (`createTask`, `setTaskPercent`, `reorderTasks`, etc., all in `tasksApi.ts`) goes directly to Firestore and the UI updates only when the listener echoes the change back. Keep this pattern when adding features — don't introduce local state that Firestore's listener would fight with.

### Auth

Sign-in is anonymous by default (`watchAuth` in `firebase.ts` auto-calls `signInAnonymously` when there's no user), so the app works instantly with no signup screen. `signInWithGoogle` *links* Google to that same anonymous user via `linkWithPopup` (same uid, same data carried over) rather than replacing the session, falling back to a plain `signInWithPopup` only if that Google account already belongs to a different, non-anonymous account.

Non-obvious Firebase quirk: `onAuthStateChanged` is **not** guaranteed to re-fire after `linkWithPopup`, since linking updates the same user object in place rather than firing a sign-in/out transition. `useTaskStore` exports `syncAuthUser(firebaseUser)` for exactly this — callers (see `AccountButton.tsx`) must push the linked user into the store manually after the popup resolves, rather than assuming the listener will pick it up.

Firebase init itself is guarded behind `firebaseConfigured` (`firebase.ts`) so a missing/incomplete `.env` fails gracefully in the UI (see `ConfigWarning` in `App.tsx`) instead of throwing synchronously at module load.

### Drag-and-drop

Two independent `@dnd-kit` contexts, not one: `App.tsx` owns a `DndContext` for reordering groups; each `GroupItem.tsx` owns its own nested `DndContext` for reordering tasks within that group. Both write the full new order as a Firestore batch (`reorderGroups`/`reorderTasks` in `tasksApi.ts`) rather than a single moved item's index. Reordering is disabled (`dragDisabled`/`reorderEnabled` props threaded down from `App.tsx`) whenever a search query or priority filter is active — a filtered list's array indices don't match the real unfiltered order, so dragging would silently scramble it.

### Styling

Tailwind v4 via the `@tailwindcss/vite` plugin — there is no `tailwind.config.js`; config lives in `vite.config.ts` and `src/index.css` (`@import 'tailwindcss'`). Dark mode is **class-based, not the Tailwind v4 default media-query behavior**: `@custom-variant dark (&:where(.dark, .dark *))` in `index.css` repoints `dark:` to respond to a `.dark` class on `<html>`, which `src/hooks/useTheme.ts` toggles (persisted to `localStorage`, three-way Light/Dark/Auto).

### Other non-obvious pieces

- `src/speech.d.ts` — hand-written global TS declarations for the Web Speech API (`SpeechRecognition`), since these aren't in `lib.dom.d.ts`. `src/hooks/useVoiceInput.ts` wraps it; `AddTaskInput.tsx` parses the resulting transcript (or typed text) for `!high`/`!medium`/`!low` and `today`/`tomorrow` tags before creating the task.
- `vite.config.ts` — this Vite build is Rolldown-based; `manualChunks` must be a function, not the classic Rollup object form (splits `firebase` and `@dnd-kit` into their own chunks so they cache independently of app code).
- PWA support (`vite-plugin-pwa`, `generateSW` mode) — manifest icons are the pre-rasterized PNGs in `public/` (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`), generated from `public/icon.svg`/`icon-maskable.svg` via Inkscape; regenerate them if the icon design changes rather than hand-editing the PNGs.

## Firestore data model

```
users/{uid}/groups/{groupId}   { name, color, order, collapsed, createdAt }
users/{uid}/tasks/{taskId}     { groupId, title, notes, percent, priority,
                                  dueDate, recurrence, completedAt, order,
                                  createdAt, updatedAt }
```

Tasks reference their group by `groupId`, not a subcollection — both collections are flat under the user. Deleting a group (`deleteGroup` in `tasksApi.ts`) cascades to delete its tasks in the same batch; without that they'd be silently orphaned (invisible but still stored).

`recurrence` (`'none' | 'daily' | 'weekdays' | 'weekly'`) and `completedAt` were added after the first tasks existed, so `watchTasks` normalizes them (`?? 'none'` / `?? null`) when reading snapshots — don't assume every doc in Firestore actually has them, only that every `Task` object the app hands you does. `completedAt` is set/cleared in `setTaskPercent` based on whether the clamped value crosses 100, and is what `src/lib/analytics.ts` (stats chips, streak) and `CompletedView.tsx` (date-bucketed history) key off — it's intentionally separate from `updatedAt`, which changes on any edit. Completing a recurring task calls `spawnNextOccurrence` (`tasksApi.ts`) to create the next instance dated from the completion day; it does not touch or delete the completed instance, and un-completing a task afterward does not retract an occurrence that already spawned.
