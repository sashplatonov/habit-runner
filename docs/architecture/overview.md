# Architecture

<a name="top"></a>

## 📋 Table of Contents

- [System overview](#system-overview)
- [Frontend](#frontend)
- [Backend](#backend)
- [Sync and preferences flow](#sync-and-preferences-flow)
- [Auth and notification endpoints](#auth-and-notification-endpoints)
- [Deployment shape](#deployment-shape)

---

## 🗺️ System overview <a name="system-overview"></a>

```text
Browser
├── React app in apps/web
│   ├── IndexedDB via Dexie
│   ├── OAuth callback handling
│   ├── Sync engine and write-through fallback
│   └── PWA service worker and notification subscription flow
│
Backend API in apps/backend
├── /auth           login, refresh, Google OAuth, preferences
├── /sync           pull and push for habits/checkins/tombstones
├── /notifications  VAPID key, subscribe, unsubscribe
├── /metrics        lightweight JSON metrics
├── /q/health       Quarkus health endpoint
└── /q/metrics      Prometheus metrics
│
PostgreSQL
└── Flyway-managed schema selected by DB_SCHEMA
```

The frontend keeps UX responsive by writing local state first and syncing in the background. The backend is the source of truth for authenticated cross-device state, OAuth, push subscriptions, and schema migrations.

[↑ Back to top](#top)

---

## 🖥️ Frontend <a name="frontend"></a>

Stack:
- React 19
- Vite 7
- TypeScript
- Dexie 4
- Vitest
- `vite-plugin-pwa`

Important paths:

| Path | Purpose |
|---|---|
| `apps/web/src/App.tsx` | App shell, auth callback, route registration |
| `apps/web/src/lib/core/config.ts` | Runtime config derived from `VITE_*` env |
| `apps/web/src/lib/api/` | HTTP clients for auth, sync, theme/preferences |
| `apps/web/src/lib/storage/` | IndexedDB schema and persistence helpers |
| `apps/web/src/lib/sync/` | Pull/push cycle, write-through fallback, sync logging |
| `apps/web/src/lib/pwa/` | Runtime caching and push subscription client flow |
| `apps/web/src/hooks/` | Theme, habits, sync engine hooks |
| `apps/web/packages/shared` | Shared DTOs consumed by the web app |
| `apps/web/tests/unit` | Frontend unit tests |

Configuration notes:
- `VITE_API_BASE_URL` sets the API origin; if omitted, dev defaults to `http://localhost:3000` and production defaults to `/api`.
- `VITE_SYNC_ENABLED=false` disables background sync for offline-only or UI-focused work.
- Faro observability is optional and controlled by `VITE_FARO_*` variables.

[↑ Back to top](#top)

---

## ⚙️ Backend <a name="backend"></a>

Stack:
- Java 25
- Quarkus 3
- Hibernate ORM with Panache
- Flyway
- PostgreSQL
- RestAssured + Quarkus JUnit tests

Important paths:

| Path | Purpose |
|---|---|
| `apps/backend/src/main/java/com/habittracker/auth` | Login, refresh, Google OAuth, preferences, JWT guard |
| `apps/backend/src/main/java/com/habittracker/sync` | Pull/push resources, DTOs, server-side sync logic |
| `apps/backend/src/main/java/com/habittracker/notification` | VAPID public key and push subscription endpoints |
| `apps/backend/src/main/java/com/habittracker/metrics` | Lightweight `/metrics` JSON payload |
| `apps/backend/src/main/java/com/habittracker/model` | Panache entities |
| `apps/backend/src/main/resources/application.properties` | Quarkus, datasource, CORS, Flyway, auth config |
| `apps/backend/src/main/resources/db/migration` | Flyway migrations |
| `apps/backend/src/test/java` | Backend tests |

Operational notes:
- Backend env is read from process environment; the current repo does not auto-load `apps/backend/.env`.
- `DB_SCHEMA` is first-class: datasource search path, Flyway schema, and Hibernate default schema are all bound to it.
- Flyway runs automatically on startup and can create the target schema if needed.

[↑ Back to top](#top)

---

## 🔄 Sync and preferences flow <a name="sync-and-preferences-flow"></a>

Current sync surface:
- `GET /sync/pull?since=<cursor>`
- `POST /sync/push`

Payload families currently handled by the backend:
- habits
- checkins
- tombstones

Client-side behavior:
- sync requests are authenticated with the access token;
- responses are marked `no-store`;
- the backend returns timing headers such as `x-sync-duration-ms` and `Server-Timing`;
- theme and timezone preferences use `GET /auth/preferences` and `PUT /auth/preferences`.

The frontend also keeps a write-through path so local habit changes can remain usable even when scheduled background sync is paused or unavailable.

[↑ Back to top](#top)

---

## 🔐 Auth and notification endpoints <a name="auth-and-notification-endpoints"></a>

Auth endpoints:

| Method | Path | Notes |
|---|---|---|
| `POST` | `/auth/login` | Lightweight email login path used for non-OAuth flows/tests |
| `GET` | `/auth/google/start` | Starts Google OAuth |
| `GET` | `/auth/google/callback` | Handles provider callback |
| `POST` | `/auth/refresh` | Refreshes access token |
| `POST` | `/auth/logout` | Revokes refresh token |
| `GET` | `/auth/preferences` | Reads theme and timezone |
| `PUT` | `/auth/preferences` | Writes theme and timezone |
| `GET` | `/auth/theme` | Theme-only compatibility endpoint |
| `PUT` | `/auth/theme` | Theme-only compatibility endpoint |

Notification endpoints:

| Method | Path | Notes |
|---|---|---|
| `GET` | `/notifications/vapid-public-key` | Public key for the browser subscription flow |
| `POST` | `/notifications/subscribe` | Stores browser endpoint and keys |
| `DELETE` | `/notifications/unsubscribe` | Removes an endpoint |

[↑ Back to top](#top)

---

## 🐳 Deployment shape <a name="deployment-shape"></a>

Root `docker-compose.yml` defines:
- `web`: nginx-served frontend image built from `apps/web`
- `api`: Quarkus image built from `apps/backend`
- `db`: PostgreSQL 18 image behind the optional `db` profile

Important runtime assumptions:
- the web container proxies `/api/*` to the internal `api` service;
- `api` and `db` are not published directly for host access in the default stack;
- `docker compose --profile db up --build` is the complete local stack path when using the bundled database;
- `docker compose up --build` without the profile is valid only when `DB_*` points to an already reachable database.

[↑ Back to top](#top)
