# 🔄 Offline Sync Plan

This document describes the offline-first sync model and operational contract.

## 📑 Table of Contents

1. [Stack and Storage](#-stack-and-storage)
2. [Domain Model and Versioning](#-domain-model-and-versioning)
3. [Sync API Contract](#-sync-api-contract)
4. [Client Metadata and Triggers](#-client-metadata-and-triggers)
5. [Failure Handling](#-failure-handling)
6. [Navigation](#-navigation)

## 🧱 Stack and Storage

- Frontend: React + TypeScript + Vite (PWA-capable setup)
- Local storage: IndexedDB repositories for:
  - `habits`
  - `checkins`
  - `tombstones`
  - `sync_meta`
  - `outbox`
- Backend: NestJS + Prisma + PostgreSQL
- Auth: JWT access/refresh tokens

## 🧬 Domain Model and Versioning

- Every synced `habit` and `checkin` includes:
  - `created_at`
  - `updated_at`
  - `version`
  - `user_id`
- Deletions propagate through `tombstones` so deleted entities are not recreated.
- Cursor format uses stable ordering by `(updated_at, id)` for deterministic paging.
- Conflict policy:
  - Habits: last-write-wins using `updated_at/version`
  - Checkins: idempotent upsert semantics

## 📡 Sync API Contract

### Pull

- Endpoint: `GET /sync/pull?since=<cursor>`
- Response:
  - `{ habits, checkins, tombstones, nextCursor }`
- Behavior:
  - Returns all server-side changes after the cursor
  - Provides `nextCursor` for incremental sync

### Push

- Endpoint: `POST /sync/push`
- Request:
  - `{ ops: SyncOpDTO[] }`
- Typical operation shape:
  - `{ id, type, entity, payload, clientTime }`
- Response:
  - `{ applied, conflicts, serverTime }`
- Behavior:
  - Transactional application
  - Idempotency by operation ID
  - Explicit conflict reporting

## ⏱️ Client Metadata and Triggers

- `sync_meta` tracks:
  - `lastCursor`
  - `lastSuccessAt`
  - `lastError`
  - `status` (`offline`, `syncing`, `synced`, `error`)
- `outbox` tracks pending operations and retry metadata.
- Sync triggers:
  - app startup
  - browser `online` event
  - manual retry actions
- Execution order:
  - Pull → Push → Pull confirmation

## 🚨 Failure Handling

- Failed sync attempts increment server error metrics.
- Client keeps operations in outbox for retry instead of dropping data.
- UI should expose:
  - offline status
  - pending outbox count
  - last error details

## ↕️ Navigation

- Previous: [🏗️ Architecture Overview](./architecture.md)
- Back to docs index: [⬅️ Documentation Home](./README.md)
- Next: [🛡️ Reliability and Rollout](./reliability-rollout.md)
