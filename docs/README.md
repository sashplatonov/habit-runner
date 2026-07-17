# Habbit Runner Docs

<a name="top"></a>

This hub tracks the current repository shape and links to the operator and engineering docs that still match the checkout.

## 📋 Table of Contents

- [Project snapshot](#project-snapshot)
- [Repo layout](#repo-layout)
- [Doc index](#doc-index)
- [When docs drift](#when-docs-drift)

---

## 🎯 Project snapshot <a name="project-snapshot"></a>

- Frontend: `apps/web` with Svelte 5, SvelteKit 2, Vite, PWA support, Dexie-based offline storage, and Vitest tests.
- Shared web DTOs: `apps/web/packages/shared`.
- Backend: `apps/backend` with Quarkus, Panache, Flyway, PostgreSQL, Google OAuth, sync, notifications, and metrics endpoints.
- Deployment baseline: root `docker-compose.yml` plus optional `docker-compose.local.yml`.
- Important repo fact: there is no root `package.json`; npm workflows run from `apps/web`.

[↑ Back to top](#top)

---

## 🗂️ Repo layout <a name="repo-layout"></a>

```text
docs/
├── architecture/
│   ├── overview.md
│   └── offline-sync-plan.md
├── features/
│   └── chart-tooltips.md
├── monitoring/
│   └── newrelic.md
├── operations/
│   ├── github-automation.md
│   └── reliability-rollout.md
├── project/
│   ├── health.md
│   ├── today-ui-motivation-themes-backlog.md
│   └── ui-ux-backlog.md
└── setup/
    ├── getting-started.md
    └── web-push-setup.md
```

[↑ Back to top](#top)

---

## 📚 Doc index <a name="doc-index"></a>

| Document | Use it for |
|---|---|
| [setup/getting-started.md](./setup/getting-started.md) | Local frontend/backend startup, env requirements, Docker profile usage |
| [architecture/overview.md](./architecture/overview.md) | Current app topology, key modules, API surface |
| [architecture/offline-sync-plan.md](./architecture/offline-sync-plan.md) | Offline sync model, outbox flow, conflict notes |
| [architecture/habit-mutation-api.md](./architecture/habit-mutation-api.md) | Habit create/update/status/delete contracts and frontend reconciliation |
| [setup/web-push-setup.md](./setup/web-push-setup.md) | VAPID setup, notification verification |
| [operations/reliability-rollout.md](./operations/reliability-rollout.md) | Health checks, rollout checklist, rollback notes |
| [operations/github-automation.md](./operations/github-automation.md) | Renovate state and manual security scan guidance |
| [monitoring/newrelic.md](./monitoring/newrelic.md) | Canonical backend observability contract and New Relic rollout guardrails |
| [project/health.md](./project/health.md) | Quality gates, tests, repo-level verification habits |
| [project/ui-ux-backlog.md](./project/ui-ux-backlog.md) | UI/UX, maintainability, and UI-code quality backlog tied to current `apps/web` files |
| [project/today-ui-motivation-themes-backlog.md](./project/today-ui-motivation-themes-backlog.md) | Today UI, mobile interaction, motivation, theme architecture, and verification evidence |
| [features/chart-tooltips.md](./features/chart-tooltips.md) | UX contract for chart guide tooltips |

[↑ Back to top](#top)

---

## ⚠️ When docs drift <a name="when-docs-drift"></a>

Update docs in the same change whenever you touch:
- runtime paths such as `apps/backend` or `apps/web/packages/shared`;
- startup commands or environment variable names;
- Docker profile assumptions, especially the `db` profile;
- auth, sync, notification, or monitoring endpoints;
- user-facing build or verification commands.

Historical references to `apps/backend`, root workspaces, Prisma, or NestJS describe an older structure and should be treated as stale unless explicitly restored in code.

[↑ Back to top](#top)
