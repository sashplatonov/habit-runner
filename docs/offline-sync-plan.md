# Offline sync plan

## Stack & architecture

- Frontend: React + TypeScript + Vite powered by `vite-plugin-pwa` for Workbox-backed service worker and offline caching.
- Local storage: Dexie-backed IndexedDB with tables for `habits`, `checkins`, `tombstones`, `sync_meta`, `outbox`; the UI talks to these repositories instead of `localStorage`.
- Backend: NestJS (or Fastify) + TypeScript + Prisma/Drizzle connected to Postgres (Supabase or Neon). Auth relies on JWT access/refresh tokens.
- Hosting: frontend on Cloudflare Pages/Vercel; API on Cloudflare Workers/Fly/Render; Postgres on Supabase or Neon.

## Domain model & versioning

- Every `habit` and `checkin` row includes `created_at`, `updated_at`, `version` (increment on every mutation) and `user_id`.
- Deletions only surface through the `tombstones` table (`entity`, `entity_id`, `deleted_at`, `version`) to prevent resurrecting soft-deleted data during sync.
- Cursor format is `(server_updated_at, id)` serialized into a stable string so the pull query can page deterministically across entities ordered by timestamp + id.
- Conflict policy: `habits` follow last-write-wins by comparing server `updated_at/version`; `checkins` are idempotent upserts keyed by `(habit_id, date)` so duplicate pushes have no effect.

## Sync contract (P0)

### Pull

- `GET /sync/pull?since=<cursor>`
- Returns `{ habits: HabitDTO[], checkins: CheckinDTO[], tombstones: TombstoneDTO[], nextCursor: string }`
- Server filters rows changed after the provided cursor, sorts by `(updated_at, id)`, and emits `nextCursor` for the next page.

### Push

- `POST /sync/push` with body `{ ops: SyncOpDTO[] }`
- Each `SyncOpDTO` includes `{ id, type, entity, payload, clientTime }`
- Server applies operations inside a transaction, deduplicates by `id`, answers with `{ applied: string[], conflicts: ConflictDTO[], serverTime: string }`.
- Responses detail which ops succeeded, any conflicts, and the resulting server time used for cursor advancement.

## Client metadata & triggers

- Local `sync_meta` tracks `lastCursor`, `lastSuccessAt`, `lastError`, and `status` (`offline`, `syncing`, `synced`, `error`).
- `outbox` stores pending ops along with `opId`, `status`, `retryCount`, `nextRetryAt`, `payload`, and `clientTime`.
- Sync engine runs on app start and on the browser `online` event; it always pulls before a push and re-pulls after a push to confirm server state.
- UI surfaces the offline indicator, outbox depth, and last sync error so users can see when background sync is blocked.
