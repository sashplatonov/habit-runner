# Backend-first data path

This document replaces the retired offline-sync design notes. Habit Runner's
current product contract is intentionally simpler: authenticated habit and
check-in state is owned by the Quarkus API and persisted in PostgreSQL.

## Current flow

```text
SvelteKit route -> typed API client -> authenticated Quarkus resource
  -> application service and ownership checks -> Panache repository
  -> PostgreSQL -> DTO response -> in-memory route/store state
```

The browser uses IndexedDB only for local reminder preferences and migrations.
It does not queue habit mutations or reconcile an outbox. If the API is
unavailable, the UI keeps the current state and shows a safe degraded/error
message; it does not claim that a write succeeded.

## Conflict behavior

Habit and check-in mutations carry the server version where applicable. The API
returns a documented conflict response when another device has already changed
the record. The frontend preserves the user's edits and asks them to refresh.

## Future work

Any offline mutation feature would require a new explicit contract for durable
outbox storage, retries, idempotency, conflict resolution, and data export. It
must not be inferred from the PWA application-shell cache.
