# Project Health

<a name="top"></a>

## 📋 Table of Contents

- [Primary quality gates](#primary-quality-gates)
- [Frontend verification](#frontend-verification)
- [Backend verification](#backend-verification)
- [Known repo constraints](#known-repo-constraints)
- [Change checklist](#change-checklist)

---

## ✅ Primary quality gates <a name="primary-quality-gates"></a>

Current repo verification is split by application:

Frontend:

```bash
cd apps/web
npm run check
```

This runs:
1. `npm run lint`
2. `npm run build`
3. `npm run build:server`

Backend:

```bash
cd apps/backend
./mvnw test
./mvnw package -DskipTests
```

Use both paths for cross-cutting changes that touch the web app, API contracts, or sync behavior.

[↑ Back to top](#top)

---

## 🧪 Frontend verification <a name="frontend-verification"></a>

Frontend commands:

```bash
cd apps/web
npm run lint
npm run test
npm run build
npm run check:runtime-undefined
```

Current frontend test inventory lives in `apps/web/tests/unit` and includes coverage for:
- router behavior;
- sync engine hooks;
- write-through and serialization helpers;
- runtime caching and dev proxy helpers;
- add/edit model safety and callback safety;
- accessibility and async UI state paths.

High-risk guard:
- `apps/web/scripts/check-runtime-undefined.cjs` blocks builds on selected TypeScript diagnostics inside `apps/web/src`.
- This guard is part of the web lint/build flow and should remain green after UI refactors.

[↑ Back to top](#top)

---

## ⚙️ Backend verification <a name="backend-verification"></a>

Backend commands:

```bash
cd apps/backend
./mvnw test
./mvnw package -DskipTests
```

Current backend tests cover:
- auth refresh and logout flows;
- sync pull/push paths.

Backend runtime checks:
- `GET /q/health`
- `GET /q/metrics`
- `GET /metrics`

When you touch auth, sync, notifications, or schema migration code, verify both the Maven test path and the relevant runtime endpoint.

[↑ Back to top](#top)

---

## ⚠️ Known repo constraints <a name="known-repo-constraints"></a>

- There is no root `package.json`; do not document root-level `npm run ...` commands as if they are currently available.
- Backend env comes from the shell or Docker Compose; the repo does not auto-load `apps/backend/.env`.
- The bundled Postgres service in Docker Compose is behind the `db` profile.
- Historical docs that mention `apps/api-java`, `packages/shared` at repo root, Prisma, or NestJS are stale for the current checkout.

[↑ Back to top](#top)

---

## 🧭 Change checklist <a name="change-checklist"></a>

When a change touches habits, sync, auth, or notifications:

1. Update the code path.
2. Update docs if commands, paths, endpoints, or env names changed.
3. Run the nearest frontend verification path from `apps/web`.
4. Run the nearest backend verification path from `apps/backend`.
5. If Docker behavior changed, re-check `docker-compose.yml`, `.env.example`, and the setup docs together.

[↑ Back to top](#top)
