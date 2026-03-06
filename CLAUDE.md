<!-- Inherits global Claude rules from /Users/sash/.claude/CLAUDE.md -->
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Client (root)
```bash
npm install        # install dependencies
npm run dev        # start Vite dev server at http://localhost:5173
npm run build      # production build
npm run lint       # ESLint for .js/.jsx/.ts/.tsx
npm run preview    # preview production build
```

### Server (`cd server`)
```bash
npm install                          # install dependencies
npm run dev                          # start NestJS API at http://localhost:4000 (ts-node-dev)
npm run build                        # compile TypeScript to dist/
npm run start                        # run compiled build
npx prisma migrate dev               # apply DB migrations
npx prisma generate                  # regenerate Prisma client after schema changes
npx prisma studio                    # open Prisma Studio GUI
npm run seed                         # seed the database
```

### Docker (full stack)
```bash
docker compose up --build            # start db + api + web
docker compose up db                 # start only PostgreSQL on port 5433
```

## Architecture

This is an **offline-first habit tracker PWA** with a separate NestJS API backend.

### Client (`src/`)

- **State management**: No global store. All persistent state lives in **IndexedDB via Dexie** (`src/lib/db.ts`). React components read from IndexedDB directly through `src/hooks/useHabits.ts`.
- **Sync**: `src/lib/syncEngine.ts` implements a pull-push-pull cycle. `src/hooks/useSyncEngine.ts` runs it on mount, every 30s, and on `online` events. Mutations are written locally first, then queued in an **outbox table** in Dexie for background sync.
- **Auth**: Google OAuth only. The flow redirects through the API, landing at `/auth/callback` with tokens as query params. `src/lib/auth/session.ts` parses and stores the session. `App.tsx` gates the entire app behind `AuthGate` until a session exists.
- **Routing**: No router library — `App.tsx` manages a `view` string state (`dashboard | detail | add | edit | stats`) with a `navigate()` helper passed as props.
- **Sync cursor**: Pagination uses an opaque `"<ISO timestamp>|<id>"` cursor string stored in the `sync_meta` Dexie table.

### Server (`server/src/`)

- **Framework**: NestJS with Prisma ORM, PostgreSQL.
- **Modules**: `AppModule` → `AuthModule`, `SyncModule`, `MetricsModule`, each with a controller + service pattern.
- **Sync protocol**: `POST /sync/push` accepts an array of `SyncOpDto` operations; `GET /sync/pull?since=<cursor>` returns changed habits/checkins/tombstones since the cursor. The server uses a `SyncOpLog` table for idempotent push (deduplication by `opId`).
- **Conflict resolution**: Last-write-wins based on `updatedAt` timestamps. Conflicts are returned in the push response and retried with exponential backoff on the client.
- **Auth**: JWT access tokens + refresh tokens. `AuthGuard` validates Bearer tokens on protected routes. `ALLOW_LEGACY_X_USER` env flag enables `x-user-id` header fallback for dev/QA.
- **Database schema**: `server/prisma/schema.prisma` — models: `User`, `Habit`, `Checkin`, `Tombstone`, `SyncOpLog`, `RefreshToken`.

### Key env vars

| Location | Var | Purpose |
|---|---|---|
| `.env` | `VITE_API_BASE_URL` | API origin (default `http://localhost:4000`) |
| `.env` | `VITE_SYNC_ENABLED` | Set to `false` to disable sync |
| `.env` | `VITE_DEFAULT_USER_ID` | User ID embedded in Dexie records |
| `server/.env` | `DATABASE_URL` | PostgreSQL connection string |
| `server/.env` | `AUTH_SECRET` | JWT signing secret |
| `server/.env` | `GOOGLE_OAUTH_CLIENT_ID/SECRET` | Google OAuth credentials |
| `server/.env` | `API_PUBLIC_URL` | Public API base URL (for OAuth redirect) |
| `server/.env` | `OAUTH_DEFAULT_RETURN_TO` | Frontend origin to redirect after OAuth |
