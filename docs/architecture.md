# 🏗️ Architecture Overview

Habbit Runner is a TypeScript monorepo with a React frontend, NestJS backend, and shared contracts.

## 📑 Table of Contents

1. [High-Level View](#-high-level-view)
2. [Repository Layout](#-repository-layout)
3. [Frontend Architecture](#-frontend-architecture)
4. [Backend Architecture](#-backend-architecture)
5. [Shared Contracts](#-shared-contracts)
6. [Data and Sync Flow](#-data-and-sync-flow)
7. [Navigation](#-navigation)

## 🌐 High-Level View

```text
Web UI (React + Vite)
   ↓ HTTP + JWT
API (NestJS)
   ↓ Prisma
PostgreSQL
```

- The frontend can run offline-first behavior via IndexedDB and sync endpoints.
- The backend exposes auth, sync, and metrics endpoints.

## 🗂️ Repository Layout

- `packages/web` — React app (pages, components, hooks, client libs)
- `packages/server` — NestJS API (auth, sync, metrics, prisma)
- `packages/shared` — shared DTOs, constants, and helper types
- `docs` — operational and architectural documentation

## 🎨 Frontend Architecture

- Framework: React + TypeScript + Vite
- Structure:
  - `src/pages` for route-level screens
  - `src/components` for reusable UI pieces
  - `src/hooks` for state and side effects
  - `src/lib` for client helpers, repositories, and utilities
- Data model:
  - Local-first repositories and sync metadata
  - Feature flags via environment variables (`VITE_SYNC_ENABLED`)

## 🧠 Backend Architecture

- Framework: NestJS + TypeScript
- Modules:
  - `auth` for login, refresh, OAuth callback handling
  - `sync` for pull/push operations and conflict handling
  - `metrics` for public sync/health telemetry
  - `prisma` for database access and persistence
- Contracts are validated through DTOs and Nest validation pipes.

## 🤝 Shared Contracts

- `packages/shared` contains DTOs and constants used by both frontend and backend.
- This reduces drift between payload definitions and sync/auth semantics.

## 🔄 Data and Sync Flow

1. User action writes to local store.
2. Operation enters outbox.
3. Client performs `pull` then `push`.
4. Server applies operations transactionally.
5. Client updates cursor and local state from server response.

For full details, see [🔄 Offline Sync Plan](./offline-sync-plan.md).

## ↕️ Navigation

- Previous: [🚀 Getting Started](./getting-started.md)
- Back to docs index: [⬅️ Documentation Home](./README.md)
- Next: [🔄 Offline Sync Plan](./offline-sync-plan.md)
