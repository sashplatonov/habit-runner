# Getting Started

<a name="top"></a>

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Docker Compose](#docker-compose)
- [Google OAuth setup](#google-oauth-setup)
- [Web Push setup](#web-push-setup)
- [Env variable reference](#env-reference)

---

## ✅ Prerequisites <a name="prerequisites"></a>

- Node.js 22+
- npm 10+
- Docker + Docker Compose (for full stack or DB only)
- A Google Cloud project with OAuth credentials ([see below](#google-oauth-setup))

[↑ Back to top](#top)

---

## 💻 Local development <a name="local-development"></a>

### 1. Install dependencies

```bash
npm install
```

### 2. Start a local PostgreSQL

Easiest with Docker:

```bash
docker compose up db
```

Or use any local Postgres and set `DATABASE_URL` accordingly.

### 3. Configure the server

```bash
cat > apps/api-java/.env <<'EOF'
PORT=3000
DATABASE_URL=jdbc:postgresql://localhost:5432/habbit_runner
DB_USER=habbit
DB_PASSWORD=password
AUTH_SECRET=any-local-secret
ACCESS_TOKEN_TTL_SECONDS=3600
REFRESH_TOKEN_EXPIRES_DAYS=30
GOOGLE_OAUTH_CLIENT_ID=<your-id>
GOOGLE_OAUTH_CLIENT_SECRET=<your-secret>
API_PUBLIC_URL=http://localhost:3000
OAUTH_DEFAULT_RETURN_TO=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
EOF
```

### 4. Run migrations

```bash
# Flyway migrations are applied automatically on app startup.
# Start backend once to apply them:
npm run dev:server
```

### 5. Configure the web client

Create `apps/web/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SYNC_ENABLED=true
VITE_DEFAULT_USER_ID=demo-user
```

### 6. Start everything

```bash
npm run dev          # web + server in parallel (Turbo)
# or individually:
npm run dev:web      # Vite on http://localhost:5173
npm run dev:server   # Quarkus on http://localhost:3000
```

[↑ Back to top](#top)

---

## 🐳 Docker Compose <a name="docker-compose"></a>

### 1. Copy env file

```bash
cp .env.example .env
```

### 2. Fill in required values

Minimum required in root `.env`:

```env
AUTH_SECRET=<strong-random-string>
GOOGLE_OAUTH_CLIENT_ID=<your-id>
GOOGLE_OAUTH_CLIENT_SECRET=<your-secret>
# Optional: change default port 80
WEB_PORT=8080
```

### 3. Start

```bash
docker compose up --build
```

App is available at `http://localhost` (or `http://localhost:${WEB_PORT}`).

The `api` and `db` services have no published host ports — all external traffic goes through the `web` nginx proxy at `/api`.

### Useful commands

```bash
docker compose logs -f api           # Stream API logs
docker compose exec db psql -U ${HR_DB_USER:-habbit} -d ${HR_DB_NAME:-habbit_runner}
docker compose down -v               # Remove containers + volumes
```

[↑ Back to top](#top)

---

## 🔐 Google OAuth setup <a name="google-oauth-setup"></a>

1. Open [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → OAuth consent screen**
   - Type: **External** (or Internal for org-only)
   - Scopes: `email`, `profile`, `openid`

2. **Credentials → Create credentials → OAuth client ID**
   - Type: **Web application**
   - Authorized JavaScript origins: `http://localhost:5173` (local dev)
   - Authorized redirect URIs:
     - Local: `http://localhost:3000/auth/google/callback`
     - Docker default: `http://localhost/api/auth/google/callback`

3. Copy **Client ID** and **Client Secret** into your `.env`.

⚠️ When deploying to a real domain, add `https://yourdomain.com/api/auth/google/callback` to the authorized redirect URIs.

[↑ Back to top](#top)

---

## 🔔 Web Push setup <a name="web-push-setup"></a>

See [web-push-setup.md](./web-push-setup.md) for VAPID key generation and configuration.

[↑ Back to top](#top)

---

## ⚙️ Env variable reference <a name="env-reference"></a>

### Root `.env` (Docker)

| Variable | Required | Default | Description |
|---|---|---|---|
| `WEB_PORT` | No | `80` | Host port for the web service |
| `HR_DB_NAME` | No | `habbit_runner` | PostgreSQL database name |
| `HR_DB_USER` | No | `habbit` | PostgreSQL user |
| `HR_DB_PASSWORD` | No | `password` | PostgreSQL password |
| `DATABASE_URL` | Yes | — | Full Postgres connection string |
| `AUTH_SECRET` | Yes | — | JWT signing secret |
| `ACCESS_TOKEN_EXPIRES_IN` | No | `1h` | JWT expiry |
| `REFRESH_TOKEN_EXPIRES_DAYS` | No | `30` | Refresh token lifetime |
| `GOOGLE_OAUTH_CLIENT_ID` | Yes | — | Google OAuth client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Yes | — | Google OAuth secret |
| `API_PUBLIC_URL` | Yes | derived | Public URL of the API (used in OAuth redirect) |
| `OAUTH_DEFAULT_RETURN_TO` | Yes | derived | Frontend origin for OAuth return |
| `CORS_ORIGINS` | No | derived | Comma-separated allowed origins |
| `VAPID_PUBLIC_KEY` | No | — | VAPID key for Web Push |
| `VAPID_PRIVATE_KEY` | No | — | VAPID private key |
| `VAPID_SUBJECT` | No | — | `mailto:admin@yourdomain.com` |
| `SYNC_OP_LOG_RETENTION_DAYS` | No | `30` | Days to keep sync op log |
| `THROTTLE_TTL_SECONDS` | No | `60` | Rate limit window |
| `THROTTLE_LIMIT` | No | `120` | Max requests per window |

### `apps/web/.env` (local dev)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000` | API origin; use `/api` in Docker |
| `VITE_SYNC_ENABLED` | `true` | Set to `false` to disable sync |
| `VITE_DEFAULT_USER_ID` | — | Pre-set user ID for offline demos |

[↑ Back to top](#top)
