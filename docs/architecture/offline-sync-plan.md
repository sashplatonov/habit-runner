# Offline Sync

Status: legacy. New habit writes should target the concrete `POST /habits`, `PUT /habits/{id}`, `PATCH /habits/{id}/status`, and `DELETE /habits/{id}` endpoints; this document remains as the description of the old sync model during migration.

<a name="top"></a>

Detailed notes on the outbox pattern and conflict handling.

## 📋 Table of Contents

- [Outbox pattern](#outbox-pattern)
- [Conflict resolution](#conflict-resolution)
- [Failure modes](#failure-modes)

---

## 📤 Outbox pattern <a name="outbox-pattern"></a>

Every mutation (create, update, delete) follows this flow:

```
1. Write to IndexedDB immediately     ← UI is unblocked
2. Write to outbox table              ← pending for push
3. Sync engine picks up outbox        ← next cycle
4. POST /sync/push                    ← server processes
5. On success: delete from outbox
6. On conflict: mark failed, schedule retry
```

**Outbox entry shape:**

```typescript
{
  id: string           // local UUID
  opId: string         // server-facing unique ID (idempotency key)
  entity: 'habit' | 'checkin'
  type: 'upsert' | 'delete'
  payload: object      // full entity snapshot
  clientTime: string   // ISO timestamp of mutation
  status: 'pending' | 'failed'
  retryCount: number
  nextRetryAt: number  // ms timestamp
  lastError?: string
}
```

[↑ Back to top](#top)

---

## ⚖️ Conflict resolution <a name="conflict-resolution"></a>

**Strategy**: Last-write-wins on `updatedAt`.

When the server receives a push op:
1. Compare `payload.updatedAt` with the server record's `updatedAt`
2. If payload is newer → apply, mark `applied`
3. If server is newer → reject, return in `conflicts[]`

Conflicted entries are retried from the client after re-pulling the latest server state. After re-pull the client has the newer server version, so the conflict loop terminates.

**Version field**: each entity has a monotonically incrementing `version` for optimistic concurrency. The server bumps `version` on every write.

[↑ Back to top](#top)

---

## ⚠️ Failure modes <a name="failure-modes"></a>

| Scenario | Behaviour |
|---|---|
| Network offline | Sync skipped, status = `offline`. Resumes on `online` event. |
| Server 5xx | Sync cycle aborted, status = `error`. Retried next cycle (30s). |
| Push conflict | Op marked `failed`, retried with exponential backoff. |
| Duplicate push | `opId` deduplicated by `SyncOpLog`. Server returns `applied` for known opIds. |
| Deleted entity on client, updated on server | Tombstone wins — server records the delete in `Tombstone` table; pull distributes it to other clients. |
| Stale op log | `SyncOpLog` entries older than `SYNC_OP_LOG_RETENTION_DAYS` (default 30) are pruned by a nightly cron. |

**Retry backoff:**

```
delay = min((retryCount + 1) * 1000ms, 7000ms)
```

After 6 retries the entry stays in `failed` state and is not retried automatically. A full re-sync (pull) on next app open usually resolves stale conflicts.

[↑ Back to top](#top)
