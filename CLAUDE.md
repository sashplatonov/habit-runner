<!-- Inherits global Claude rules from /Users/sash/.claude/CLAUDE.md -->
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Client (root)
```bash
npm install        # install dependencies via workspace root
npm run dev        # runs workspace dev scripts (web + server)
npm run dev:web    # Vite dev server for @habbit-runner/web only
npm run build      # shared -> server -> web build chain
npm run build:web  # frontend-only production build
npm run lint       # runs ESLint in the workspace
cd packages/web && npm run preview    # preview the web build
```

### Server (`cd packages/server`)
```bash
npm install                          # install dependencies (runs automatically if you used root install)
npm run dev                          # start NestJS API at http://localhost:3000 (tsx watch)
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
docker compose up db                 # start only PostgreSQL inside compose network
```

## Architecture

This is an **offline-first habit tracker PWA** with a separate NestJS API backend.

### Client (`packages/web/src/`)

- **State management**: No global store. All persistent state lives in **IndexedDB via Dexie** (`packages/web/src/lib/db.ts`). React components read from IndexedDB directly through `packages/web/src/hooks/useHabits.ts`.
- **Sync**: `packages/web/src/lib/syncEngine.ts` implements a pull-push-pull cycle. `packages/web/src/hooks/useSyncEngine.ts` runs it on mount, every 30s, and on `online` events. Mutations are written locally first, then queued in an **outbox table** in Dexie for background sync.
- **Auth**: Google OAuth only. The flow redirects through the API, landing at `/auth/callback` with tokens as query params. `packages/web/src/lib/auth/session.ts` parses and stores the session. `packages/web/src/App.tsx` gates the entire app behind `AuthGate` until a session exists.
- **Routing**: No router library — `packages/web/src/App.tsx` manages a `view` string state (`dashboard | detail | add | edit | stats`) with a `navigate()` helper passed as props.
- **Sync cursor**: Pagination uses an opaque `"<ISO timestamp>|<id>"` cursor string stored in the `sync_meta` Dexie table.

### Server (`packages/server/src/`)

- **Framework**: NestJS with Prisma ORM, PostgreSQL.
- **Modules**: `AppModule` → `AuthModule`, `SyncModule`, `MetricsModule`, each with a controller + service pattern.
- **Sync protocol**: `POST /sync/push` accepts an array of `SyncOpDto` operations; `GET /sync/pull?since=<cursor>` returns changed habits/checkins/tombstones since the cursor. The server uses a `SyncOpLog` table for idempotent push (deduplication by `opId`).
- **Conflict resolution**: Last-write-wins based on `updatedAt` timestamps. Conflicts are returned in the push response and retried with exponential backoff on the client.
- **Auth**: JWT access tokens + refresh tokens. `AuthGuard` validates Bearer tokens on protected routes. `ALLOW_LEGACY_X_USER` env flag enables `x-user-id` header fallback for dev/QA.
- **Database schema**: `packages/server/prisma/schema.prisma` — models: `User`, `Habit`, `Checkin`, `Tombstone`, `SyncOpLog`, `RefreshToken`.

- **Shared DTOs**: `packages/shared` exports the Habit/Sync payload, conflict, and auth types so both packages share a single source of truth for sync data.

### Key env vars

| Location | Var | Purpose |
|---|---|---|
| `packages/web/.env` | `VITE_API_BASE_URL` | API origin (default `http://localhost:3000` for local, `/api` for Docker with nginx proxy) |
| `packages/web/.env` | `VITE_SYNC_ENABLED` | Set to `false` to disable sync |
| `packages/web/.env` | `VITE_DEFAULT_USER_ID` | User ID embedded in Dexie records |
| `.env` | `WEB_PORT`, `HR_DB_*` | Docker Compose published web port and Postgres container credentials |
| `.env` | `DATABASE_URL`, `AUTH_SECRET`, token TTLs, Google OAuth vars | Docker Compose source for `api` container env |
| `docker-compose.yml` defaults | `API_PUBLIC_URL`, `OAUTH_DEFAULT_RETURN_TO` | Derived from `WEB_PORT` (`/api` + frontend origin) unless explicitly overridden |
| `packages/server/.env` | `DATABASE_URL` | Local (non-Docker) PostgreSQL connection string |
| `packages/server/.env` | `AUTH_SECRET` | Local JWT signing secret |
| `packages/server/.env` | `GOOGLE_OAUTH_CLIENT_ID/SECRET` | Local Google OAuth credentials |
| `packages/server/.env` | `API_PUBLIC_URL`, `OAUTH_DEFAULT_RETURN_TO` | Local OAuth redirect settings |
