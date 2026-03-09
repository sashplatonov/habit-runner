# 🏃 Habbit Runner

Habbit Runner is built on a [Magic Patterns](https://magicpatterns.com) Vite template tailored to this design: [Source Design](https://www.magicpatterns.com/c/a6wro8plb53dmt2pzr6t7n)

## 📚 Documentation

- 📌 Start here: [docs/README.md](./docs/README.md)
- 🏗️ Architecture: [docs/architecture.md](./docs/architecture.md)
- 🚀 Initial setup: [docs/getting-started.md](./docs/getting-started.md)
- 🔄 Offline sync: [docs/offline-sync-plan.md](./docs/offline-sync-plan.md)
- 🛡️ Reliability and rollout: [docs/reliability-rollout.md](./docs/reliability-rollout.md)
- 🤖 GitHub automation (Renovate + Trivy): [docs/github-automation.md](./docs/github-automation.md)
- 🧹 Project health review: [docs/project-health.md](./docs/project-health.md)

## 🚀 Getting Started

1. Run `npm install`
2. Run `npm run dev`

## ✅ Quality Gates

- `npm run lint` runs ESLint for all workspaces.
- `npm run build` builds shared, server, and web through Turbo.
- `npm run check` is the recommended pre-PR command:
  - lint
  - full build
  - server build
  - Prisma client generation in `packages/server`

## 📦 Current State (March 9, 2026)

- ✅ Monorepo with npm workspaces: `packages/web`, `packages/server`, `packages/shared`
- ✅ ESLint v10 flat-config in all packages
- ✅ Web unit tests on Vitest
- ✅ Security and dependency automation via Renovate + Trivy
- ✅ Dependency cleanup applied in web package (`@emotion/react` removed as unused)

## ⚙️ Environment

### 🖥️ Client

- Copy `.env.example` to `.env` and tune the following keys:
  - `VITE_API_BASE_URL` (defaults to `http://localhost:4000`)
  - `VITE_SYNC_ENABLED` lets you disable sync (`false` to stay offline)
  - `API_PORT`, `WEB_PORT`, `DB_PORT` control `docker compose` published ports

### 🧠 API

   1. `cd packages/server`
   2. Copy `packages/server/.env.example` to `packages/server/.env` and update each value to match your database and secrets:
      - `DATABASE_URL`, `AUTH_SECRET`, `ACCESS_TOKEN_EXPIRES_IN`, `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_TOKEN_EXPIRES_DAYS`
      - When running the API via `docker compose`, PostgreSQL lives at the `db` service, so the default `DATABASE_URL=postgresql://habbit:password@db:5432/habbit_runner` works. When you run `npm run dev` against a standalone Postgres on your machine, change the host to `localhost:5432`.
      - Compose also supports `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` overrides for the DB service.
   - For OAuth login, configure Google credentials only:
     - `GOOGLE_OAUTH_CLIENT_ID`
     - `GOOGLE_OAUTH_CLIENT_SECRET`
     - Redirect config: `API_PUBLIC_URL` (public URL of API) and `OAUTH_DEFAULT_RETURN_TO` (UI origin)
3. Run `npm install` (first time) and start the API with `npm run dev`

### 🔐 Google Authentication

> The application no longer supports Apple OAuth — only the `/auth/google` flow is available in the UI.

1. Open the [Google Cloud Console](https://console.cloud.google.com) and make sure the project selector (top bar) shows the project you want to use. If needed, create a new project (`Select a project → NEW PROJECT`) and wait for it to finish provisioning.
2. In the same bar, click **APIs & Services → OAuth consent screen**. Choose either **External** (if anyone outside your Google Workspace will log in) or **Internal** (if just your organization). Click **CREATE** and:
   - Give the app a name, support email, and an optional logo. You can leave everything else blank for local testing.
   - Under **Scopes**, click **Add or Remove Scopes**, search for `email`, `profile`, and `openid`, then add each one.
   - Scroll down, click **Save and Continue**, skip the optional **Test users** section for Internal apps (or add your accounts manually), and finish the wizard.
3. Go to **Credentials** in the left sidebar, then click **Create credentials → OAuth client ID**. Choose **Web application** as the application type. Name it e.g. “Habbit Runner Local”.
   - In **Authorized JavaScript origins** add `http://localhost:5173` if you run the frontend locally.
   - In **Authorized redirect URIs** add `http://localhost:4000/auth/google/callback`. If you run the API under a different host/port (e.g., on a remote server), use that base URL instead, keeping `/auth/google/callback` at the end.
   - Click **Create**; Google displays a modal with your **Client ID** and **Client Secret**.
4. Copy the values into `packages/server/.env` for `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`. Keep this file secret.
5. Confirm `API_PUBLIC_URL` matches the API base URL you actually hit (e.g., `http://localhost:4000`) and `OAUTH_DEFAULT_RETURN_TO` equals the frontend origin (`http://localhost:5173`). These settings ensure the redirect back path aligns with the ones you registered in the Google Console.
6. Start the backend and frontend (`docker compose`, `npm run dev`, whatever your workflow is). In the UI click **Continue with Google**; you will be redirected through Google’s login screens, and after granting consent you’ll land back at `http://localhost:5173/auth/callback` with the tokens appended as query parameters.
7. When you deploy to another domain, revisit the Google credential: add that domain to **Authorized redirect URIs** (again ending with `/auth/google/callback`), and update `API_PUBLIC_URL`/`OAUTH_DEFAULT_RETURN_TO` before issuing new client secrets to avoid redirect mismatches.
