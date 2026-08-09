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

- Node.js 22.12+
- npm 10+
- Java 25
- Docker + Docker Compose
- A Google Cloud project if you need real OAuth login

Important repo note:

- there is no root `package.json`, so npm commands run from `apps/web`;
- `apps/web/package.json` declares the frontend Node runtime contract, and GitHub Actions verifies it with Node 22.12.0;
- backend configuration comes from shell environment or Docker Compose, not from an auto-loaded `apps/backend/.env`.

[↑ Back to top](#top)

---

## 💻 Frontend setup <a name="frontend-setup"></a>

Install dependencies and start Vite:

```bash
cd apps/web
npm -v
node -v
npm install
```

Use Node.js 22.12.0 or newer before running the frontend commands above. That matches the current Docker build image and the Vite 8 baseline this repository is moving toward.

Create `apps/web/.env.local` when you want explicit local overrides:

```env
VITE_API_BASE_URL=http://localhost:3000
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

If port `5432` is already occupied, keep `DB_PORT=5432` for container-to-container
traffic and choose a free host port, for example `DB_HOST_PORT=55432`.

For the standard local setup, the backend dev profile now provides matching defaults automatically:

- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_NAME=habbit_runner`
- `DB_USER=habbit`
- `DB_PASSWORD=password`
- `DB_SCHEMA=habbit_runner`
- `API_PORT=3000`
- `AUTH_SECRET=change-me` (development profile only)
- `ACCESS_TOKEN_TTL_SECONDS=3600`
- `REFRESH_TOKEN_EXPIRES_DAYS=30`
- `JWT_ISSUER=habittracker-local`
- `API_PUBLIC_URL=http://localhost:3000`
- `OAUTH_DEFAULT_RETURN_TO=http://localhost:5173`
- `CORS_ORIGINS=http://localhost:5173`

DB/auth secrets should come from your shell environment or from a local env file that you source before starting Quarkus. The dev profile still has fallback values for convenience, but production startup and readiness reject placeholder auth secrets and localhost callback URLs.

Repo helper for that flow:

```bash
cd apps/web
npm run dev:server
```

That helper sources the workspace root `.env` when it exists, overrides the host-dev callback/origin values back to `3000` and `5173`, and on macOS tries Java 25 via `java_home` with an SDKMAN fallback.

Only export variables when you need to override those defaults or enable optional integrations:

```bash
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
export VAPID_SUBJECT=mailto:admin@localhost
```

Then run Quarkus dev mode:

```bash
cd apps/backend
./mvnw clean quarkus:dev
```

Useful backend commands:

```bash
cd apps/backend
./mvnw test
./mvnw package -DskipTests
```

Notes:

- Flyway migrations run automatically on backend startup.
- the Compose `db` profile now publishes PostgreSQL on `localhost:5432` for host-based Quarkus runs;
- `JAVA_HOME` should point to Java 25 before starting the backend;
- If OAuth is not configured, UI-only work can still proceed with sync disabled or with limited unauthenticated screens.

[↑ Back to top](#top)

---

## 🐳 Docker Compose setup <a name="docker-compose-setup"></a>

Copy the root env template:

```bash
cp .env.example .env
```

The template contains local-only database and auth values. Replace both before
using the stack in any shared or production environment. Compose refuses to
resolve when either required value is blank or missing.

For the full local stack with the bundled database:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile db up --build
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
- health probes are available through `/api/q/health/live` and
  `/api/q/health/ready` on the web ingress; the API container also checks
  readiness internally;
- metrics are outbound New Relic telemetry, not a public `/metrics` route;
- `docker-compose.dokploy.yml` is the Dokploy entry point. It keeps the API
  without a host port, exposes web port 80 to the configured router, and
  attaches both services to the external `dokploy-ipv6` network.
- When `VAPID_PUBLIC_KEY` is empty, `/q/health/ready` stays UP and the
  notification check reports `status=disabled` instead of blocking startup.

Dokploy deployment:

```bash
docker compose -f docker-compose.dokploy.yml config --quiet
docker compose -f docker-compose.dokploy.yml up -d --build --remove-orphans
```

The local health checks above do not prove deployed ingress. After a Dokploy
rollout, verify the actual configured domain separately with a body-suppressing
request such as:

```bash
curl -fsS -o /dev/null -w 'deployed ready HTTP %{http_code}\n' \
  https://<configured-domain>/api/q/health/ready
```

Do not add credentials or metrics payloads to these checks or to shell history.

[↑ Back to top](#top)

---

## 🔐 Google OAuth setup <a name="google-oauth-setup"></a>

1. In Google Cloud Console, configure an OAuth consent screen with `email`, `profile`, and `openid`.
2. Create a Web application client.
3. Add these redirect URIs as needed:
   - local backend: `http://localhost:3000/auth/google/callback`
   - local preview proxy: `http://localhost:5137/api/auth/google/callback`
   - docker through nginx: `https://yourdomain.com/api/auth/google/callback`
4. Set:
   - `GOOGLE_OAUTH_CLIENT_ID`
   - `GOOGLE_OAUTH_CLIENT_SECRET`
   - `API_PUBLIC_URL`
   - `OAUTH_DEFAULT_RETURN_TO`
5. Restart the backend after changing auth configuration.

For this repository's host-based dev flow, the callback URI must match `API_PUBLIC_URL`. If your root `.env` points local auth through the preview proxy, use `http://localhost:5137/api/auth/google/callback`; if you talk to the backend directly, use `http://localhost:3000/auth/google/callback`.

Use matching origins:

- local frontend: `http://localhost:5173`
- docker default local web origin: `http://localhost` or `http://localhost:5137` depending on which compose file you use

[↑ Back to top](#top)

---

## 📱 Telegram Mini App setup <a name="telegram-mini-app-setup"></a>

1. In [@BotFather](https://t.me/BotFather), create or select the production
   bot and use **Bot Settings → Mini Apps → Configure Mini App** to set the
   Main Mini App URL to the deployed HTTPS web origin (for example,
   `https://habbit-runner.app`). Telegram must be able to reach this URL over
   HTTPS; localhost is for local browser testing only.
2. Keep local, staging, and production bots/URLs separate. A test account must
   launch the staging Mini App, sign in with Telegram, link an email account in
   both directions, close/reopen the webview, and confirm the same habits and
   check-ins are visible before production rollout.
3. Provision `TELEGRAM_BOT_TOKEN` only in the backend runtime secret store.
   Never put it in `VITE_*`, the static web image, source control, logs, or a
   client request. Set `TELEGRAM_INIT_DATA_MAX_AGE_SECONDS` to the freshness
   bound accepted by the deployment (the default is 86400 seconds).
4. Set the public `VITE_TELEGRAM_MINI_APP_URL` build variable to the same HTTPS
   URL when the web UI should render a launch/link entry point. This value is
   public and contains no credential.

Telegram deep links may use `https://t.me/<bot_username>?startapp=<payload>`;
the payload is non-secret routing context and must not contain the bot token.
After changing BotFather settings or runtime secrets, restart the backend and
check `/api/q/health/ready` before manual testing.

[↑ Back to top](#top)

---

## 🧾 Environment reference <a name="environment-reference"></a>

### Root `.env` for Docker Compose

| Variable | Required | Purpose |
|---|---|---|
| `WEB_PORT` | Yes | Host port mapped to the web container (default: `5137`) |
| `API_PORT` | Yes | Backend HTTP port inside the container |
| `DB_HOST` | Yes | Database host for the backend |
| `DB_PORT` | Yes | Database connection port used by the backend |
| `DB_HOST_PORT` | No | Host port published by the bundled Compose database; defaults to `DB_PORT` for backward compatibility |
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
| `NEW_RELIC_METRICS_ENABLED` | No | Enables New Relic metric export; requires `NEW_RELIC_LICENSE_KEY` when `true` |
| `GOOGLE_OAUTH_CLIENT_ID` | Optional | Needed for real Google sign-in; required for production startup and readiness |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Optional | Needed for real Google sign-in; required for production startup and readiness |
| `TELEGRAM_BOT_TOKEN` | Optional locally; required in production | Backend-only bot token used to verify Telegram Mini App init data |
| `TELEGRAM_INIT_DATA_MAX_AGE_SECONDS` | No | Maximum Telegram init-data age; defaults to `86400` seconds |
| `VITE_TELEGRAM_MINI_APP_URL` | No | Public HTTPS Main Mini App URL exposed to the static frontend |
| `VAPID_PUBLIC_KEY` | Optional | Browser push public key |
| `VAPID_PRIVATE_KEY` | Optional | Browser push private key |
| `VAPID_SUBJECT` | Optional | Web Push contact |
|  |  |

### `apps/web/.env.local`

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000` in dev | API origin override |
| `VITE_DEFAULT_USER_ID` | `demo-user` | Demo/default user seed |
|  |  |  |

[↑ Back to top](#top)
