<!-- Inherits global Claude rules from /Users/sash/.claude/CLAUDE.md -->
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Workspace root
```bash
npm install        # install dependencies via workspace root
npm run dev        # runs workspace dev scripts (web + server)
npm run dev:web    # Vite dev server for @habbit-runner/web only
npm run build      # shared -> server -> web build chain
npm run build:web  # frontend-only production build
npm run lint       # runs ESLint in the workspace
npm run check      # lint + build + Java build
cd apps/web && npm run preview    # preview the web build
```

### Java API (`cd apps/api-java`)
```bash
./mvnw quarkus:dev                  # start Quarkus dev mode at http://localhost:3000
./mvnw package -DskipTests          # build server artifact
./mvnw test                         # run Java tests
```

### Legacy Nest API (removed)
The legacy NestJS + Prisma reference backend has been removed from the workspace. The active backend is now `apps/api-java/` (Quarkus + Flyway + PostgreSQL). If you need archived Prisma artifacts, check `archive/`.

### Docker (full stack)
```bash
docker compose up --build            # start db + api + web
docker compose up db                 # start only PostgreSQL inside compose network
```

## Architecture

This is an **offline-first habit tracker PWA** with an active Quarkus API backend and a legacy NestJS reference backend.

### Client (`apps/web/src/`)

- **State management**: No global store. All persistent state lives in **IndexedDB via Dexie** (`apps/web/src/lib/db.ts`). React components read from IndexedDB directly through `apps/web/src/hooks/useHabits.ts`.
- **Sync**: `apps/web/src/lib/syncEngine.ts` implements a pull-push-pull cycle. `apps/web/src/hooks/useSyncEngine.ts` runs it on mount, every 30s, and on `online` events. Mutations are written locally first, then queued in an **outbox table** in Dexie for background sync.
- **Auth**: Google OAuth only. The flow redirects through the API, landing at `/auth/callback` with tokens as query params. `apps/web/src/lib/auth/session.ts` parses and stores the session. `apps/web/src/App.tsx` gates the entire app behind `AuthGate` until a session exists.
- **Routing**: No router library — `apps/web/src/App.tsx` manages a `view` string state (`dashboard | detail | add | edit | stats`) with a `navigate()` helper passed as props.
- **Sync cursor**: Pagination uses an opaque `"<ISO timestamp>|<id>"` cursor string stored in the `sync_meta` Dexie table.

### Server (`apps/api-java/src/main/java/com/habittracker/`)

- **Framework**: Quarkus with Hibernate ORM Panache, Flyway, PostgreSQL.
- **Main packages**: `auth`, `sync`, `metrics`, `notification`, `model`.
- **Sync protocol**: `POST /sync/push` accepts sync operations; `GET /sync/pull?since=<cursor>` returns changed habits/checkins/tombstones since the cursor.
- **Conflict resolution**: Last-write-wins based on `updatedAt` timestamps. Conflicts are returned in the push response and retried with exponential backoff on the client.
- **Auth**: JWT access tokens + refresh tokens with Google OAuth login.
- **Database schema**: Flyway SQL migrations in `apps/api-java/src/main/resources/db/migration/`.

- **Shared DTOs**: `packages/shared` exports the Habit/Sync payload, conflict, and auth types so both packages share a single source of truth for sync data.

### Key env vars

| Location | Var | Purpose |
|---|---|---|
| `apps/web/.env` | `VITE_API_BASE_URL` | API origin (default `http://localhost:3000` for local, `/api` for Docker with nginx proxy) |
| `apps/web/.env` | `VITE_SYNC_ENABLED` | Set to `false` to disable sync |
| `apps/web/.env` | `VITE_DEFAULT_USER_ID` | User ID embedded in Dexie records |
| `.env` | `WEB_PORT`, `HR_DB_*` | Docker Compose published web port and Postgres container credentials |
| `.env` | `DATABASE_URL`, `AUTH_SECRET`, token TTLs, Google OAuth vars | Docker Compose source for `api` container env |
| `docker-compose.yml` defaults | `API_PUBLIC_URL`, `OAUTH_DEFAULT_RETURN_TO` | Derived from `WEB_PORT` (`/api` + frontend origin) unless explicitly overridden |
| `apps/api-java/.env` | `DATABASE_URL`, `DB_USER`, `DB_PASSWORD` | Local (non-Docker) PostgreSQL connection settings |
| `apps/api-java/.env` | `AUTH_SECRET`, `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_TOKEN_EXPIRES_DAYS` | Local JWT settings |
| `apps/api-java/.env` | `GOOGLE_OAUTH_CLIENT_ID/SECRET` | Local Google OAuth credentials |
| `apps/api-java/.env` | `API_PUBLIC_URL`, `OAUTH_DEFAULT_RETURN_TO`, `CORS_ORIGINS` | Local OAuth and CORS settings |
