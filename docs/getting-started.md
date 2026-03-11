# 🚀 Getting Started

Set up Habbit Runner locally for frontend and backend development.

## 📑 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Initial Setup](#-initial-setup)
3. [Run in Development](#-run-in-development)
4. [Environment Variables](#-environment-variables)
5. [Docker Workflow](#-docker-workflow)
6. [Verification Checklist](#-verification-checklist)
7. [Navigation](#-navigation)

## 🧰 Prerequisites

- Node.js 20+ and npm
- Docker + Docker Compose (optional)
- PostgreSQL (if running backend without Docker)

## ⚙️ Initial Setup

1. Install dependencies from the repository root:
   - `npm install`
2. Configure frontend environment:
   - Create `packages/web/.env` with required `VITE_*` variables
3. Configure Docker Compose environment (only if you run Docker):
   - Copy `.env.example` to `.env`
4. Configure backend environment (for local non-Docker server runs):
   - Create `packages/server/.env` with database/auth/OAuth variables
5. Generate Prisma client:
   - `cd packages/server && npx prisma generate`

## 💻 Run in Development

- Full workspace: `npm run dev`
- Frontend only: `npm run dev:web`
- Backend only: `npm run dev:server`

## 🔐 Environment Variables

### Frontend (`packages/web/.env`)

- `VITE_API_BASE_URL` (default `http://localhost:3000` for local dev; use `/api` in Docker Compose)
- `VITE_SYNC_ENABLED` (`true` or `false`)
- `VITE_DEFAULT_USER_ID` seeds Dexie records for offline demos
- For Docker Compose, frontend requests are proxied by nginx, so use `/api` as the client base URL.

### Root (`.env`)

- Docker source of truth for all container env:
  - published port: `WEB_PORT` (frontend entrypoint)
  - DB container credentials: `HR_DB_NAME`, `HR_DB_USER`, `HR_DB_PASSWORD`
  - API container settings: `DATABASE_URL`, `DEFAULT_DB_SCHEMA`, `AUTH_SECRET`, token TTLs, Google OAuth credentials (`api` runs on internal `3000`)
  - `api` and `db` are internal-only in Docker Compose (no published host ports)
  - OAuth URLs are derived in Compose from `WEB_PORT` by default:
    - `API_PUBLIC_URL` -> `http://localhost:${WEB_PORT}/api`
    - `OAUTH_DEFAULT_RETURN_TO` -> `http://localhost:${WEB_PORT}`

### Backend (`packages/server/.env`)

Used only by local API runs (`npm run dev:server` / `npm run dev`), not by Docker Compose.

- Database and auth:
  - `DATABASE_URL`
  - `AUTH_SECRET`
  - `ACCESS_TOKEN_EXPIRES_IN`
  - `ACCESS_TOKEN_TTL_SECONDS`
  - `REFRESH_TOKEN_EXPIRES_DAYS`
  - `DEFAULT_DB_SCHEMA` (default `public`) controls which Postgres schema hosts the Prisma tables.
  - Prisma will run `CREATE SCHEMA IF NOT EXISTS` before the first connection, but you still need to apply the Prisma migrations/seeds inside that schema before relying on the tables.
- Google OAuth:
  - `GOOGLE_OAUTH_CLIENT_ID`
  - `GOOGLE_OAUTH_CLIENT_SECRET`
  - `API_PUBLIC_URL`
  - `OAUTH_DEFAULT_RETURN_TO`

## 🐳 Docker Workflow

1. Set Docker host (Colima):
   - `export DOCKER_HOST=unix:///Users/sash/.colima/default/docker.sock`
2. Start the default stack (no database container):
   - `docker compose up --build`
   - Ensure `.env` defines a reachable `DATABASE_URL`, because the stack will not start Postgres unless you enable the `db` profile; otherwise `api` will fail waiting for a local database.
3. Start the stack with the Postgres database included (profile `db` must be enabled):
   - `docker compose --profile db up --build`

## ✅ Verification Checklist

Run these checks before shipping changes:

1. `npm run lint`
2. `npm run build`
3. `cd packages/server && npm run build`

## ↕️ Navigation

- Back to docs index: [⬅️ Documentation Home](./README.md)
- Next: [🏗️ Architecture Overview](./architecture.md)
- Back to repository root: [⬅️ Root README](../README.md)
