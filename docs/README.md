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
├── packages/
│   ├── web/        React + Vite PWA (frontend)
│   ├── server/     NestJS + Prisma API (backend)
│   └── shared/     Shared TypeScript types and DTOs
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
| Backend | NestJS 11, Prisma 7, PostgreSQL |
| Auth | Google OAuth + JWT (access + refresh) |
| Sync | Custom pull-push-pull cycle with outbox |
| Push | Web Push (VAPID via `web-push`) |
| Infrastructure | Docker Compose, Nginx, Turbo monorepo |

[↑ Back to top](#top)

---

## 📚 Docs index <a name="docs-index"></a>

| Document | Contents |
|---|---|
| [getting-started.md](./getting-started.md) | Local dev setup, Docker setup, env vars |
| [architecture.md](./architecture.md) | Sync protocol, data flow, module structure |
| [offline-sync-plan.md](./offline-sync-plan.md) | Outbox pattern, conflict resolution, retry |
| [WEB_PUSH_SETUP.md](./WEB_PUSH_SETUP.md) | VAPID key generation, push subscription flow |
| [github-automation.md](./github-automation.md) | Renovate, Trivy scanner setup |
| [project-health.md](./project-health.md) | Linting, testing, quality gates |

[↑ Back to top](#top)
