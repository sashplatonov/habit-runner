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
   - Copy `packages/web/.env.example` to `packages/web/.env`
3. Configure backend environment:
   - Copy `packages/server/.env.example` to `packages/server/.env`
4. Generate Prisma client:
   - `cd packages/server && npx prisma generate`

## 💻 Run in Development

- Full workspace: `npm run dev`
- Frontend only: `npm run dev:web`
- Backend only: `npm run dev:server`

## 🔐 Environment Variables

### Frontend (`packages/web/.env`)

- `VITE_API_BASE_URL` (default `http://localhost:4000`)
- `VITE_SYNC_ENABLED` (`true` or `false`)
- `VITE_DEFAULT_USER_ID` seeds Dexie records for offline demos

### Root (`.env`)

- `API_PORT`, `WEB_PORT`, `DB_PORT` (for Docker Compose)
- `HR_DB_NAME`, `HR_DB_USER`, `HR_DB_PASSWORD` (for the Postgres container used by Docker Compose; kept separate from generic `POSTGRES_*` platform variables)

### Backend (`packages/server/.env`)

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
2. Start stack:
   - `docker compose up --build`

## ✅ Verification Checklist

Run these checks before shipping changes:

1. `npm run lint`
2. `npm run build`
3. `cd packages/server && npm run build`

## ↕️ Navigation

- Back to docs index: [⬅️ Documentation Home](./README.md)
- Next: [🏗️ Architecture Overview](./architecture.md)
- Back to repository root: [⬅️ Root README](../README.md)
