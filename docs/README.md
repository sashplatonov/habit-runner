# Habbit Runner — Overview

<a name="top"></a>

Offline-first habit tracker PWA with Google OAuth, background sync, and web push notifications.

## 📋 Table of Contents

- [What it is](#what-it-is)
- [Repository layout](#repository-layout)
- [Tech stack](#tech-stack)
- [Docs index](#docs-index)

---

## 🎯 What it is <a name="what-it-is"></a>

Users track habits with flexible schedules (daily, N days/week, N times/month, specific weekdays). The app works fully offline — all data is written to IndexedDB first, then synced to the server in the background.

Key features:
- **Offline-first**: works without a network; syncs when online
- **Habit schedules**: daily, weekly (specific days or quota), monthly (specific weeks or quota)
- **Freeze days**: skip a day without breaking a streak
- **Web Push notifications**: browser-level reminders
- **Google OAuth only** — no email/password

[↑ Back to top](#top)

---

## 📁 Repository layout <a name="repository-layout"></a>

```
habbit-runner/
├── apps/
│   ├── web/            React + Vite PWA (frontend)
│   ├── api-java/       Quarkus API (active backend)
│   └── api-nest-legacy/ NestJS + Prisma API (legacy reference)
├── packages/
│   └── shared/         Shared TypeScript types and DTOs
├── docker-compose.yml
├── .env.example    Copy to .env for Docker
└── turbo.json      Build orchestration
```

[↑ Back to top](#top)

---

## 🛠️ Tech stack <a name="tech-stack"></a>

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Offline storage | Dexie (IndexedDB wrapper) |
| Backend | Java 25, Quarkus 3, PostgreSQL |
| Auth | Google OAuth + JWT (access + refresh) |
| Sync | Custom pull-push-pull cycle with outbox |
| Push | Web Push (VAPID via `web-push`) |
| Infrastructure | Docker Compose, Nginx, Turbo monorepo |

[↑ Back to top](#top)

---

## 📚 Docs index <a name="docs-index"></a>

| Document | Contents |
|---|---|
| [setup/getting-started.md](./setup/getting-started.md) | Local dev setup, Docker setup, env vars |
| [architecture/overview.md](./architecture/overview.md) | Sync protocol, data flow, module structure |
| [features/chart-tooltips.md](./features/chart-tooltips.md) | UX contract for explanatory chart and heatmap tooltips |
| [architecture/offline-sync-plan.md](./architecture/offline-sync-plan.md) | Outbox pattern, conflict resolution, retry |
| [setup/web-push-setup.md](./setup/web-push-setup.md) | VAPID key generation, push subscription flow |
| [operations/github-automation.md](./operations/github-automation.md) | Renovate, Trivy scanner setup |
| [project/health.md](./project/health.md) | Linting, testing, quality gates |

[↑ Back to top](#top)
