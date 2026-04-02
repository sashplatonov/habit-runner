# Architecture

<a name="top"></a>

## 📋 Table of Contents

- [System overview](#system-overview)
- [Frontend](#frontend)
- [Backend](#backend)
- [Sync protocol](#sync-protocol)
- [Habit schedules](#habit-schedules)
- [Auth flow](#auth-flow)
- [Database schema](#database-schema)
- [API endpoints](#api-endpoints)

---

## 🗺️ System overview <a name="system-overview"></a>

```
Browser
├── React app (Vite)
│   ├── Dexie (IndexedDB) ← source of truth for UI
│   ├── Outbox table     ← pending mutations
│   └── Sync engine      ← pull-push-pull every 30s
│
Nginx (port 80 in Docker)
├── /        → web (React build)
└── /api/*   → api service (port 3000)
│
NestJS API
├── AuthModule   (OAuth, JWT)
├── SyncModule   (pull/push)
├── NotificationModule (Web Push)
└── Prisma → PostgreSQL
```

All UI state reads from IndexedDB. The server is only involved during sync cycles — the app is fully functional offline.

[↑ Back to top](#top)

---

## 🖥️ Frontend <a name="frontend"></a>

**Stack**: React 19, Vite, TypeScript, Tailwind CSS, Dexie 4

**Key modules:**

| File | Purpose |
|---|---|
| `src/lib/storage/db.ts` | Dexie schema, all DB read/write helpers |
| `src/hooks/useHabits.ts` | Main data hook — habits, completions, mutations |
| `src/lib/sync/syncEngine.ts` | Pull-push-pull sync implementation |
| `src/hooks/useSyncEngine.ts` | Sync scheduler (mount, 30s, online event) |
| `src/lib/auth/session.ts` | Token storage, refresh, expiry check |
| `src/lib/habits/schedule.ts` | Schedule calculations (streak, mandatory check) |
| `src/App.tsx` | BrowserRouter setup, AuthGate, sync init, OAuth callback handling |

**Routing**: Custom `BrowserRouter` in `src/lib/router.tsx` — provides `BrowserRouter`, `Routes`, `Route`, `Navigate`, `Link`, `NavLink`, `useNavigate`, `useLocation`, `useParams`. Supports dynamic segments (`:id`), wildcard `*`, and `replace` history mode. No external router library dependency.

**State**: No Redux/Zustand. All persistent state in IndexedDB. React state for UI-only concerns.

**IndexedDB tables:**

| Table | Contents |
|---|---|
| `habits` | Habit entity with schedule, metadata |
| `checkins` | Daily completion records |
| `tombstones` | Soft-delete markers for deleted entities |
| `sync_meta` | Sync cursor, last sync time, status |
| `outbox` | Pending mutations waiting to be pushed |

[↑ Back to top](#top)

---

## ⚙️ Backend <a name="backend"></a>

**Stack**: NestJS 11, Prisma 7, PostgreSQL, TypeScript

**Module structure:**

```
AppModule
├── PrismaModule          — DB connection (extends PrismaClient)
├── AuthModule            — OAuth flow, JWT, token refresh
├── SyncModule            — pull/push endpoints + op log cleanup cron
├── MetricsModule         — sync performance metrics
└── NotificationModule    — Web Push subscription management
```

**Rate limiting** (ThrottlerModule):
- Default: 120 req / 60s
- Auth endpoints: 10 req / 60s
- Theme endpoints: 20 req / 60s

[↑ Back to top](#top)

---

## 🔄 Sync protocol <a name="sync-protocol"></a>

**Pattern**: Pull → Push → Pull (one cycle)

```
1. PULL  GET /sync/pull?since=<cursor>
         → receives changed habits, checkins, tombstones
         → applied to IndexedDB

2. PUSH  POST /sync/push  { ops: [SyncOp, ...] }
         → outbox entries sent to server
         → applied: entries removed from outbox
         → conflicts: entry marked failed, retry with backoff

3. PULL  GET /sync/pull?since=<newCursor>
         → picks up any server-side changes from step 2

4. Update sync_meta: cursor, lastSyncedAt, status=idle
```

**Scheduler triggers:**
- App mount (if authenticated)
- Every 30 seconds
- `online` browser event
- Tab visibility change (tab becomes visible)

**Conflict resolution**: Last-write-wins on `updatedAt` timestamp.

**Idempotency**: Each push op has a unique `opId`. Server records processed opIds in `SyncOpLog` — duplicate pushes are silently ignored.

**Cursor format**: `"<ISO timestamp>|<entity id>"` — opaque pagination token.

**Pagination**: Pull returns max 200 items per entity type per request. Client follows `nextCursor` until empty.

**Outbox retry backoff:**
```
delay = (retryCount + 1) * 1000ms   // 2s, 3s, 4s ... capped at 7s
```

[↑ Back to top](#top)

---

## 📅 Habit schedules <a name="habit-schedules"></a>

**Schedule types** (stored as JSON on `Habit`):

| Type | Config | Meaning |
|---|---|---|
| `daily` | — | Every day |
| `weekly_days` | `weekdays: number[]` | Specific days of week (0=Sun) |
| `weekly_quota` | `timesPerWeek: number` | N times per rolling 7-day window |
| `monthly_weeks` | `weeksOfMonth`, `weekdays` | Specific week(s) of month on specific days |
| `monthly_quota` | `timesPerMonth: number` | N times per rolling 30-day window |

**Mandatory check** (`isMandatoryToday`): a habit is mandatory for today if:
1. Its schedule pattern matches today (correct day/week)
2. For quota types: quota is not yet met in the rolling window

Habits with met quotas are excluded from the pending list, progress ring, and summary streak.

**Freeze days**: dates stored as `YYYY-MM-DD` strings in `habit.freezeDays[]`. A frozen day is counted as completed for streak purposes.

[↑ Back to top](#top)

---

## 🔐 Auth flow <a name="auth-flow"></a>

```
1. UI → GET /auth/google/start?returnTo=<frontend-url>
2. Server stores state, redirects to Google consent
3. Google → GET /auth/google/callback?code=X&state=Y
4. Server exchanges code → user upserted in DB
5. Server redirects to <returnTo>/auth/callback?accessToken=...&refreshToken=...&expiresIn=...
6. Frontend parses URL params, stores tokens in localStorage
7. All API requests: Authorization: Bearer <accessToken>
8. On expiry: POST /auth/refresh → new access token
```

**Token storage key**: `habbitRunner.auth.session`

[↑ Back to top](#top)

---

## 🗄️ Database schema <a name="database-schema"></a>

```
User
  id, email, theme, createdAt

Habit
  id, userId, name, description, color, icon
  frequency, schedule (JSON), customDays (JSON)
  dailyTarget, targetStreak, tags (JSON)
.  archived, sortOrder, type (positive|negative)
  reminderTime, reminderEnabled
  freezeDays (JSON []), createdAt, updatedAt, version

Checkin
  id, habitId, userId, date, done, count
  createdAt, updatedAt, version
  unique(habitId, date)

Tombstone          — soft delete markers for sync
SyncOpLog          — processed op IDs (idempotency)
RefreshToken       — refresh tokens with revocation
OAuthState         — temp OAuth CSRF state
PushSubscription   — Web Push endpoints + encryption keys
```

[↑ Back to top](#top)

---

## 🌐 API endpoints <a name="api-endpoints"></a>

All protected routes require `Authorization: Bearer <token>`.

**Auth**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/auth/google/start` | — | Start OAuth flow |
| GET | `/auth/google/callback` | — | OAuth callback |
| POST | `/auth/refresh` | — | Refresh access token |
| POST | `/auth/logout` | ✅ | Revoke refresh token |
| GET | `/auth/theme` | ✅ | Get user theme |
| PUT | `/auth/theme` | ✅ | Update user theme |

**Sync**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/sync/pull?since=<cursor>` | ✅ | Fetch changes since cursor |
| POST | `/sync/push` | ✅ | Push local mutations |

**Notifications**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/notifications/vapid-public-key` | — | Get VAPID public key |
| POST | `/notifications/subscribe` | ✅ | Register push subscription |
| POST | `/notifications/unsubscribe` | ✅ | Remove push subscription |

[↑ Back to top](#top)
