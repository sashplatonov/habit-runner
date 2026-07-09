# AI Fix Log

## 2026-07-09 - Backend-first habit and check-in mutations

- Change:
  Authenticated habit and check-in flows no longer use Dexie/IndexedDB as the source of truth inside `habitsStore`. The store now refreshes from the backend, applies habit/check-in mutations through direct REST calls, and rebuilds the UI snapshot from in-memory state. Check-in dates are normalized to the canonical completion-key format during hydration and mutations.
- Risk:
  Authenticated pages now depend on successful backend reads after page load, so offline-only behavior for those pages is intentionally reduced. Public marketing/PWA caching is unchanged.
- Rollback:
  Revert the `habitsStore` backend-first refactor and restore the previous Dexie-backed store implementation if offline-first authenticated behavior must return before a server-backed design is ready.
