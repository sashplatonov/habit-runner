# Backend Service

<a name="top"></a>

## 📋 Table of Contents

- [What lives here](#what-lives-here)
- [Run locally](#run-locally)
- [Build and test](#build-and-test)
- [Environment contract](#environment-contract)
- [Key endpoints](#key-endpoints)

---

## ⚙️ What lives here <a name="what-lives-here"></a>

This directory contains the active Habbit Runner backend:

- Quarkus 3 application
- Hibernate ORM with Panache
- Flyway migrations
- PostgreSQL datasource
- auth, sync, notification, and metrics resources

[↑ Back to top](#top)

---

## 🚀 Run locally <a name="run-locally"></a>

Start a database first, for example with the repo Compose profile:

```bash
cd /Users/sash/Dev/Projects/habbit-runner
docker compose --profile db up -d db
```

For the standard local dev path, Quarkus uses the `%dev` profile only for local fallback defaults:

- backend listens on `http://localhost:3000`
- frontend stays on `http://localhost:5173`
- the Compose `db` profile publishes PostgreSQL on `localhost:5432`
- DB/auth secrets can be provided by your shell env or by sourcing a local env file before startup

With Java 25 selected, run:

```bash
cd /Users/sash/Dev/Projects/habbit-runner/apps/backend
./mvnw clean quarkus:dev
```

Important:

- if you override the local defaults, export env vars in your shell before starting Quarkus;
- `cd /Users/sash/Dev/Projects/habbit-runner/apps/web && npm run dev:server` is the repo helper that sources the root `.env`, lets those values override the `%dev` fallbacks, and on macOS tries Java 25 via `java_home` with an SDKMAN fallback;
- Google OAuth redirect URIs still need to be registered for the local backend origin you use;
- `JAVA_HOME` should point to Java 25 for this module;
- Flyway migrations run on startup.

[↑ Back to top](#top)

---

## 🧪 Build and test <a name="build-and-test"></a>

```bash
cd /Users/sash/Dev/Projects/habbit-runner/apps/backend
./mvnw test
./mvnw package -DskipTests
```

Docker image build used by the repo (JVM default):

```bash
docker build -t habbit-backend:local -f Dockerfile .
```

Native image build (uses `.native` suffix for tags):

```bash
docker build -t habbit-backend:local.native -f Dockerfile.native .
```

[↑ Back to top](#top)

---

## 🧾 Environment contract <a name="environment-contract"></a>

Required core variables:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SCHEMA`
- `API_PORT`
- `AUTH_SECRET`
- `ACCESS_TOKEN_TTL_SECONDS`
- `REFRESH_TOKEN_EXPIRES_DAYS`
- `JWT_ISSUER`
- `API_PUBLIC_URL`
- `OAUTH_DEFAULT_RETURN_TO`
- `CORS_ORIGINS`

Local `%dev` defaults cover these values for the common host-based setup, so they are only required when you need to override the standard local ports/credentials or when running outside the dev profile.

Optional feature variables:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- For metrics to Grafana Cloud Mimir, run the Alloy sidecar from `docker-compose.yml`
  and keep remote-write credentials in environment variables (do NOT bake secrets into images).

[↑ Back to top](#top)

---

## 🌐 Key endpoints <a name="key-endpoints"></a>

- `GET /q/health`
- `GET /q/metrics`
- `GET /metrics`
- `GET /auth/google/start`
- `GET /auth/google/callback`
- `POST /auth/refresh`
- `GET /auth/preferences`
- `PUT /auth/preferences`
- `GET /sync/pull`
- `POST /sync/push`
- `GET /notifications/vapid-public-key`
- `POST /notifications/subscribe`
- `DELETE /notifications/unsubscribe`

[↑ Back to top](#top)
