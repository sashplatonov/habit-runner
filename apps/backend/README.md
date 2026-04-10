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

Export the required env in your shell, then run:

```bash
cd /Users/sash/Dev/Projects/habbit-runner/apps/backend
./mvnw quarkus:dev
```

Important:
- backend config is read from environment variables;
- this repo does not auto-load `apps/backend/.env`;
- Flyway migrations run on startup.

[↑ Back to top](#top)

---

## 🧪 Build and test <a name="build-and-test"></a>

```bash
cd /Users/sash/Dev/Projects/habbit-runner/apps/backend
./mvnw test
./mvnw package -DskipTests
```

Docker image build used by the repo:

```bash
docker build -t habbit-backend:local -f Dockerfile.jvm .
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

Optional feature variables:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
 - For logs and traces we recommend running Grafana Agent/Promtail on the host and
 	keeping container images free of secrets (do NOT bake Loki/OTLP or OTLP creds into images).

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
