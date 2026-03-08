# 🛡️ Reliability and Rollout

This guide covers auth safety, observability, rollout stages, and fallback behavior.

## 📑 Table of Contents

1. [Auth and Multi-User Isolation](#-auth-and-multi-user-isolation)
2. [Metrics and Observability](#-metrics-and-observability)
3. [Rollout Stages](#-rollout-stages)
4. [Backward Compatibility and Rollback](#-backward-compatibility-and-rollback)
5. [Navigation](#-navigation)

## 🔐 Auth and Multi-User Isolation

- API sync endpoints require `Authorization: Bearer <access_token>`.
- Login flow:
  - `POST /auth/login` returns access + refresh tokens.
  - `POST /auth/refresh` rotates access token from refresh token.
- User isolation:
  - `SyncController` resolves `user.id` from JWT to keep tenant boundaries strict.
- Debug fallback:
  - `ALLOW_LEGACY_X_USER=true` temporarily allows legacy `x-user-id` behavior in dev-only scenarios.

## 📈 Metrics and Observability

- `MetricsService` records:
  - pull/push counts
  - average latencies
  - conflicts
  - sync failures
- Public endpoint:
  - `GET /metrics`
- Trace correlation:
  - API accepts `x-trace-id`
  - if absent, server generates UUID
  - trace ID is returned in response headers and logged in failure paths

## 🚦 Rollout Stages

1. Beta (closed):
   - `ALLOW_LEGACY_X_USER=true`
   - `VITE_SYNC_ENABLED=true`
   - monitor `/metrics` and logs
2. Staging ramp:
   - disable `ALLOW_LEGACY_X_USER`
   - validate strict auth behavior
   - monitor conflicts and sync error rate
3. Full release:
   - production database and API exposure
   - gradual frontend rollout
   - remove temporary flags

## ♻️ Backward Compatibility and Rollback

- Client fallback:
  - `VITE_SYNC_ENABLED=false` keeps app local-only via IndexedDB.
- Server fallback:
  - temporary `ALLOW_LEGACY_X_USER` for controlled debug windows.
- Operational rollback:
  - switch client to offline mode
  - investigate `/metrics`, logs, and trace IDs
  - retry synchronization after server stability recovery

## ↕️ Navigation

- Previous: [🔄 Offline Sync Plan](./offline-sync-plan.md)
- Back to docs index: [⬅️ Documentation Home](./README.md)
- Back to repository root: [⬅️ Root README](../README.md)
