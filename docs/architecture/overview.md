# Architecture

<a name="top"></a>

## 📋 Table of Contents

- [System overview](#system-overview)
- [Frontend](#frontend)
- [Backend](#backend)
- [Habit and preferences flow](#habit-and-preferences-flow)
- [Auth and notification endpoints](#auth-and-notification-endpoints)
- [Deployment shape](#deployment-shape)

---

## 🗺️ System overview <a name="system-overview"></a>

```text
Browser
├── SvelteKit app in apps/web
│   ├── OAuth callback handling
│   ├── Backend-first habit and check-in API clients
│   ├── IndexedDB only for browser-local reminder preferences
│   └── PWA service worker and notification subscription flow
│
Backend API in apps/backend
├── /auth           login, refresh, Google OAuth, preferences
├── /habits         authenticated habit CRUD
├── /checkins       authenticated check-in CRUD
├── /notifications  VAPID key, subscribe, unsubscribe
├── /q/health       Quarkus health endpoint
└── New Relic       APM, logs-in-context, browser telemetry
│
PostgreSQL
└── Flyway-managed schema selected by DB_SCHEMA
```

The frontend renders authenticated data returned by the API. The backend is the source of truth for habit state, check-ins, OAuth, push subscriptions, and schema migrations; changing habit data requires an authenticated network request.

[↑ Back to top](#top)

---

## 🖥️ Frontend <a name="frontend"></a>

Stack:
- Svelte 5 and SvelteKit 2
- Vite 8
- TypeScript
- Dexie 4
- Vitest
- `vite-plugin-pwa`

Important paths:

| Path | Purpose |
|---|---|
| `apps/web/src/routes/` | SvelteKit routes, layouts, and error pages |
| `apps/web/src/lib/api/` | HTTP clients for auth, habits, check-ins, and preferences |
| `apps/web/src/lib/storage/` | IndexedDB for browser-local reminder preferences |
| `apps/web/src/sw-custom.ts` | PWA runtime caching and push subscription flow |
| `apps/web/src/lib/stores/` | Shared client-side view state |
| `apps/web/packages/shared` | Shared DTOs consumed by the web app |
| `apps/web/tests/unit` | Frontend unit tests |

Configuration notes:
- `VITE_API_BASE_URL` sets the API origin; if omitted, dev defaults to `http://localhost:3000` and production defaults to `/api`.
- The PWA caches its application shell for repeat visits; authenticated habit mutations remain
  backend-first and require a network connection.

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
| `apps/backend/src/main/java/com/sashplatonov/habbit/runner/auth` | Login, refresh, Google OAuth, preferences, JWT guard |
| `apps/backend/src/main/java/com/sashplatonov/habbit/runner/habit` | Authenticated habit resources, services, and DTOs |
| `apps/backend/src/main/java/com/sashplatonov/habbit/runner/checkin` | Authenticated check-in resources, services, and DTOs |
| `apps/backend/src/main/java/com/sashplatonov/habbit/runner/notification` | VAPID public key and push subscription endpoints |
| `apps/backend/src/main/java/com/sashplatonov/habbit/runner/metrics` | Business metrics exported through New Relic Micrometer registry |
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

## 🔄 Habit and preferences flow <a name="habit-and-preferences-flow"></a>

Current habit surface:
- `GET`, `POST /habits`
- `GET`, `PUT`, `DELETE /habits/{habitId}`
- authenticated check-in resources under `/checkins`

Client-side behavior:
- habit and check-in requests are authenticated with the access-token cookie;
- mutations are applied only after the API confirms the write;
- responses are marked `no-store` where appropriate;
- theme and timezone preferences use `GET /auth/preferences` and `PUT /auth/preferences`.

The frontend keeps the server as the canonical source and exposes a clear degraded state when the
network is unavailable; it does not queue offline habit mutations.

[↑ Back to top](#top)

---

## 🔐 Auth and notification endpoints <a name="auth-and-notification-endpoints"></a>

Auth endpoints:

| Method | Path | Notes |
|---|---|---|
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
