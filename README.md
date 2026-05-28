# Habbit Runner

<a name="top"></a>

Offline-first habit tracker with a React PWA frontend, a Quarkus backend, Google OAuth, background sync, and optional web push notifications.

## 📋 Table of Contents

- [Current state](#current-state)
- [Repository layout](#repository-layout)
- [Quick start](#quick-start)
- [Docker stack](#docker-stack)
- [Quality checks](#quality-checks)
- [Documentation map](#documentation-map)

---

## ✅ Current state <a name="current-state"></a>

- Frontend lives in `apps/web` and owns the JavaScript workspace, shared package, tests, and build scripts.
- Backend lives in `apps/backend` and is a Quarkus 3 + Flyway + PostgreSQL service.
- There is no root `package.json` in the current checkout, so frontend npm commands run from `apps/web`.
- Docker Compose is rooted at the repository root and uses `apps/web/Dockerfile` plus `apps/backend/Dockerfile`.
- The local Compose database service is behind the `db` profile, so full local stack startup requires `--profile db`.

[↑ Back to top](#top)

---

## 🗂️ Repository layout <a name="repository-layout"></a>

```text
habbit-runner/
├── apps/
│   ├── web/
│   │   ├── src/                  React app, PWA, Dexie sync client
│   │   ├── tests/                Vitest unit tests
│   │   └── packages/shared/      Shared TypeScript DTOs used by the web app
│   └── backend/
│       ├── src/main/java/        Auth, sync, notification, metrics resources
│       ├── src/main/resources/   Quarkus config, Flyway migrations, logback
│       └── src/test/java/        Quarkus tests
├── docs/                         Setup, architecture, operations, monitoring
├── docker-compose.yml
├── docker-compose.local.yml
└── .env.example
```

[↑ Back to top](#top)

---

## 🚀 Quick start <a name="quick-start"></a>

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

The Vite dev server uses `http://localhost:3000` by default unless `VITE_API_BASE_URL` or `API_TARGET_URL` says otherwise.

### Backend

```bash
docker compose --profile db up -d db

export GOOGLE_OAUTH_CLIENT_ID=...
export GOOGLE_OAUTH_CLIENT_SECRET=...

cd apps/backend
./mvnw clean quarkus:dev
```

The backend `%dev` profile now supplies the standard local defaults automatically:

- Postgres at `localhost:5432`
- API at `http://localhost:3000`
- frontend return origin `http://localhost:5173`
- DB connection details and auth secrets can come from your shell env or a sourced local env file

If you keep local secrets in the workspace root `.env`, `cd apps/web && npm run dev:server` loads that file before starting Quarkus, lets those env values override the `%dev` fallbacks, and on macOS tries Java 25 via `java_home` with an SDKMAN fallback. OAuth still requires the corresponding local redirect URI to be registered in Google Cloud.

If you do not need sign-in or push notifications while working on UI-only flows, the frontend can still run with sync disabled via `VITE_SYNC_ENABLED=false`.

[↑ Back to top](#top)

---

## 🐳 Docker stack <a name="docker-stack"></a>

For a full local stack with the bundled Postgres container:

```bash
cp .env.example .env
docker compose --profile db up --build
```

Notes:

- `db` starts only when the `db` profile is enabled.
- `api` is reachable externally through the `web` nginx proxy at `/api`.
- `docker-compose.local.yml` exposes the web app on `http://localhost:5137`.
- `docker compose up --build` without `--profile db` assumes `DB_*` points at an already available database.

Local compose modes
-------------------

This repository provides two compose entrypoints:

- `docker-compose.yml` — default: builds and runs the JVM Quarkus runner (uses `apps/backend/Dockerfile`).
- `docker-compose.native.yml` — native mode (uses `apps/backend/Dockerfile.native`).

Run local JVM mode (build + start):

```bash
cp .env.example .env
docker compose up -d --build --profile db
```

Run native mode (build + start):

Note: native builds require a compatible Mandrel/GraalVM builder image. The default
builder image is set via the `MANDREL_BUILDER_IMAGE` build-arg in `apps/backend/Dockerfile.native`. If your
`pom.xml` Java version differs from the builder, set `MANDREL_BUILDER_IMAGE` accordingly before running.

```bash
cp .env.example .env
# Optionally override builder image if needed (example Mandrel image targeting JDK 25):
# export MANDREL_BUILDER_IMAGE=quay.io/quarkus/ubi9-quarkus-mandrel-builder-image:jdk-25
docker compose -f docker-compose.native.yml up -d --build --profile db
```

[↑ Back to top](#top)

---

## 🧪 Quality checks <a name="quality-checks"></a>

Frontend:

```bash
cd apps/web
npm run lint
npm run test
npm run build
npm run check
```

Backend:

```bash
cd apps/backend
./mvnw test
./mvnw package -DskipTests
```

`apps/web/scripts/check-runtime-undefined.cjs` is part of the frontend lint/build path and fails early on high-risk TypeScript regressions in `apps/web/src`.

[↑ Back to top](#top)

---

## 📚 Documentation map <a name="documentation-map"></a>

- Docs hub: [docs/README.md](./docs/README.md)
- Architecture: [docs/architecture/overview.md](./docs/architecture/overview.md)
- Setup: [docs/setup/getting-started.md](./docs/setup/getting-started.md)
- Offline sync notes: [docs/architecture/offline-sync-plan.md](./docs/architecture/offline-sync-plan.md)
- Web Push setup: [docs/setup/web-push-setup.md](./docs/setup/web-push-setup.md)
- Reliability and rollout: [docs/operations/reliability-rollout.md](./docs/operations/reliability-rollout.md)
- GitHub automation: [docs/operations/github-automation.md](./docs/operations/github-automation.md)
- Monitoring: [docs/monitoring/newrelic.md](./docs/monitoring/newrelic.md) for the default path and [docs/monitoring/grafana-cloud.md](./docs/monitoring/grafana-cloud.md) for the legacy Alloy path
- Project health: [docs/project/health.md](./docs/project/health.md)

[↑ Back to top](#top)
