# Getting Started

<a name="top"></a>

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Frontend setup](#frontend-setup)
- [Backend setup](#backend-setup)
- [Docker Compose setup](#docker-compose-setup)
- [Google OAuth setup](#google-oauth-setup)
- [Environment reference](#environment-reference)

---

## ✅ Prerequisites <a name="prerequisites"></a>

- Node.js 22+
- npm 10+
- Java 25
- Docker + Docker Compose
- A Google Cloud project if you need real OAuth login

Important repo note:
- there is no root `package.json`, so npm commands run from `apps/web`;
- backend configuration comes from shell environment or Docker Compose, not from an auto-loaded `apps/backend/.env`.

[↑ Back to top](#top)

---

## 💻 Frontend setup <a name="frontend-setup"></a>

Install dependencies and start Vite:

```bash
cd apps/web
npm install
```

Create `apps/web/.env.local` when you want explicit local overrides:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SYNC_ENABLED=true
VITE_DEFAULT_USER_ID=demo-user
```

Run the frontend:

```bash
cd apps/web
npm run dev
```

Useful frontend commands:

```bash
cd apps/web
npm run lint
npm run test
npm run build
npm run check
```

[↑ Back to top](#top)

---

## ⚙️ Backend setup <a name="backend-setup"></a>

Start a local Postgres instance first. The easiest repo-native path is the Compose database profile:

```bash
docker compose --profile db up -d db
```

Export backend env vars in your shell:

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=habbit_runner
export DB_USER=habbit
export DB_PASSWORD=password
export DB_SCHEMA=habbit_runner
export API_PORT=3000
export AUTH_SECRET=change-me
export ACCESS_TOKEN_EXPIRES_IN=1h
export ACCESS_TOKEN_TTL_SECONDS=3600
export REFRESH_TOKEN_EXPIRES_DAYS=30
export JWT_ISSUER=habittracker-local
export API_PUBLIC_URL=http://localhost:3000
export OAUTH_DEFAULT_RETURN_TO=http://localhost:5173
export CORS_ORIGINS=http://localhost:5173
export GOOGLE_OAUTH_CLIENT_ID=...
export GOOGLE_OAUTH_CLIENT_SECRET=...
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
export VAPID_SUBJECT=mailto:admin@localhost
```

Then run Quarkus dev mode:

```bash
cd apps/backend
./mvnw quarkus:dev
```

Useful backend commands:

```bash
cd apps/backend
./mvnw test
./mvnw package -DskipTests
```

Notes:
- Flyway migrations run automatically on backend startup.
- `DB_SCHEMA` is required by the current Quarkus config path.
- If OAuth is not configured, UI-only work can still proceed with sync disabled or with limited unauthenticated screens.

[↑ Back to top](#top)

---

## 🐳 Docker Compose setup <a name="docker-compose-setup"></a>

Copy the root env template:

```bash
cp .env.example .env
```

For the full local stack with the bundled database:

```bash
docker compose --profile db up --build
```

For a stack that targets an already running external database:

```bash
docker compose up --build
```

Useful commands:

```bash
docker compose --profile db up -d db
docker compose logs -f api
docker compose logs -f web
docker compose down -v
```

Current Compose behavior:
- `db` is behind the `db` profile;
- `api` is exposed only to the internal Docker network;
- browser traffic reaches the backend through the `web` nginx proxy at `/api`;
- `docker-compose.local.yml` exposes the web app on `http://localhost:5137`.

[↑ Back to top](#top)

---

## 🔐 Google OAuth setup <a name="google-oauth-setup"></a>

1. In Google Cloud Console, configure an OAuth consent screen with `email`, `profile`, and `openid`.
2. Create a Web application client.
3. Add these redirect URIs as needed:
   - local backend: `http://localhost:3000/auth/google/callback`
   - docker through nginx: `https://yourdomain.com/api/auth/google/callback`
4. Set:
   - `GOOGLE_OAUTH_CLIENT_ID`
   - `GOOGLE_OAUTH_CLIENT_SECRET`
   - `API_PUBLIC_URL`
   - `OAUTH_DEFAULT_RETURN_TO`
5. Restart the backend after changing auth configuration.

Use matching origins:
- local frontend: `http://localhost:5173`
- docker default local web origin: `http://localhost` or `http://localhost:5137` depending on which compose file you use

[↑ Back to top](#top)

---

## 🧾 Environment reference <a name="environment-reference"></a>

### Root `.env` for Docker Compose

| Variable | Required | Purpose |
|---|---|---|
| `WEB_PORT` | Yes | Internal web service port mapping in templates |
| `API_PORT` | Yes | Backend HTTP port inside the container |
| `DB_HOST` | Yes | Database host for the backend |
| `DB_PORT` | Yes | Database port |
| `DB_NAME` | Yes | Database name |
| `DB_USER` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `DB_SCHEMA` | Yes | Active schema for Flyway and Hibernate |
| `AUTH_SECRET` | Yes | JWT signing secret |
| `ACCESS_TOKEN_EXPIRES_IN` | No | Human-readable token TTL |
| `ACCESS_TOKEN_TTL_SECONDS` | Yes | Access token TTL in seconds |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Yes | Refresh token lifetime |
| `JWT_ISSUER` | Yes | JWT issuer |
| `API_PUBLIC_URL` | Yes | Public backend URL used in OAuth redirects |
| `OAUTH_DEFAULT_RETURN_TO` | Yes | Frontend URL after auth |
| `CORS_ORIGINS` | Yes | Allowed frontend origins |
| `GOOGLE_OAUTH_CLIENT_ID` | Optional | Needed for real Google sign-in |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Optional | Needed for real Google sign-in |
| `VAPID_PUBLIC_KEY` | Optional | Browser push public key |
| `VAPID_PRIVATE_KEY` | Optional | Browser push private key |
| `VAPID_SUBJECT` | Optional | Web Push contact |
|  |  |

### `apps/web/.env.local`

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000` in dev | API origin override |
| `VITE_SYNC_ENABLED` | `true` | Set `false` to disable sync |
| `VITE_DEFAULT_USER_ID` | `demo-user` | Demo/default user seed |
|  |  |  |

[↑ Back to top](#top)
