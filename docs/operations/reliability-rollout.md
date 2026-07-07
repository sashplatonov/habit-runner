# Reliability and Rollout

<a name="top"></a>

## 📋 Table of Contents

- [Health checks](#health-checks)
- [Deployment paths](#deployment-paths)
- [Migration behavior](#migration-behavior)
- [Rollback notes](#rollback-notes)
- [Operational checks](#operational-checks)

---

## 🏥 Health checks <a name="health-checks"></a>

Current runtime endpoints:

| Endpoint | Purpose |
|---|---|
| `/q/health` | Quarkus health |

Docker Compose health checks currently monitor:

| Service | Check |
|---|---|
| `db` | `pg_isready -U ${DB_USER} -d ${DB_NAME}` |
| `api` | `curl -f http://127.0.0.1:${API_PORT}/q/health` |
| `web` | `wget -q -O /dev/null http://127.0.0.1:80` |

Important current behavior:
- `db` is behind the `db` profile;
- `api` does not publish a host port in the default stack;
- external browser traffic reaches the API through the `web` proxy at `/api`;
- backend observability details live in [docs/monitoring/newrelic.md](../monitoring/newrelic.md).

[↑ Back to top](#top)

---

## 🚀 Deployment paths <a name="deployment-paths"></a>

### Full local stack with bundled Postgres

```bash
cp .env.example .env
docker compose --profile db up --build
```

### Stack against an external database

```bash
cp .env.example .env
docker compose up --build
```

### App-only rebuilds

```bash
docker compose up -d --build --no-deps api
docker compose up -d --build --no-deps web
```

Before rollout:
- confirm `DB_*`, `DB_SCHEMA`, `AUTH_SECRET`, `API_PUBLIC_URL`, and `OAUTH_DEFAULT_RETURN_TO`;
- confirm Google OAuth redirect URIs match the deployed public URL;
- confirm VAPID vars are present if notifications are expected;
- confirm the target DB is reachable if you are not enabling the `db` profile.

[↑ Back to top](#top)

---

## 🗃️ Migration behavior <a name="migration-behavior"></a>

Flyway runs automatically on backend startup.

Current backend config:
- `quarkus.flyway.migrate-at-start=true`
- `quarkus.flyway.create-schemas=true`
- schema selection follows `DB_SCHEMA`

Local backend verification:

```bash
cd apps/backend
./mvnw quarkus:dev
```

Build-time verification:

```bash
cd apps/backend
./mvnw package -DskipTests
```

Operational caution:
- treat schema changes as production-impacting even when Flyway applies them automatically;
- back up the database before destructive or irreversible migrations.

[↑ Back to top](#top)

---

## ↩️ Rollback notes <a name="rollback-notes"></a>

There is no automatic rollback workflow in the current repo.

Recommended rollback pattern:
1. restore the previous application images or commit;
2. restart `api` and `web`;
3. restore the database from backup if a migration changed schema or data incompatibly.

If the problem is configuration-only:
- revert `.env` or deployment secret changes first;
- re-check OAuth redirect URLs and `DB_SCHEMA`;
- validate `/q/health` before reopening traffic.

[↑ Back to top](#top)

---

## 🧭 Operational checks <a name="operational-checks"></a>

Useful commands:

```bash
docker compose logs -f api
docker compose logs -f web
docker compose --profile db ps
```

```bash
curl http://localhost/api/q/health
curl http://localhost/api/metrics
```

If you use `docker-compose.local.yml`, the web app is available on `http://localhost:5137`, so the equivalent health path becomes `http://localhost:5137/api/q/health`.

[↑ Back to top](#top)
