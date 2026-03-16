# Reliability & Rollout

<a name="top"></a>

## 📋 Table of Contents

- [Health checks](#health-checks)
- [Deploying](#deploying)
- [Database migrations](#database-migrations)
- [Rollback](#rollback)
- [Observability](#observability)

---

## 🏥 Health checks <a name="health-checks"></a>

Docker Compose health checks:

| Service | Check | Interval |
|---|---|---|
| `db` | `pg_isready` | 5s |
| `api` | TCP socket on port 3000 | 10s |
| `web` | HTTP GET `localhost:80` | 10s |

The `api` service waits for `db` to be healthy before starting. The `web` service waits for `api`.

[↑ Back to top](#top)

---

## 🚀 Deploying <a name="deploying"></a>

**Docker Compose (recommended):**

```bash
# Pull latest code
git pull

# Rebuild and restart with zero-downtime (one service at a time)
docker compose up -d --build --no-deps api
docker compose up -d --build --no-deps web
```

`db` does not need a rebuild unless the compose file changes.

**Environment checklist before deploy:**
- [ ] `AUTH_SECRET` is a strong random string (not the example value)
- [ ] `GOOGLE_OAUTH_CLIENT_ID/SECRET` are set
- [ ] Redirect URIs in Google Console match `API_PUBLIC_URL`
- [ ] `VAPID_*` keys set if push notifications are used
- [ ] `CORS_ORIGINS` includes the production frontend domain

[↑ Back to top](#top)

---

## 🗃️ Database migrations <a name="database-migrations"></a>

Migrations run automatically on `api` container start via `docker-entrypoint.sh`:

```bash
npx prisma migrate deploy
```

For local development:

```bash
cd packages/server
npx prisma migrate dev        # create + apply migration
npx prisma migrate deploy     # apply existing migrations (prod-style)
npx prisma generate           # regenerate client after schema change
```

⚠️ Always back up the database before applying migrations in production.

[↑ Back to top](#top)

---

## ↩️ Rollback <a name="rollback"></a>

There is no automatic rollback. Steps:

1. Restore the previous Docker image tag:
   ```bash
   docker compose up -d --no-build api  # using previous image if tagged
   ```
2. If the migration changed the schema destructively, restore from DB backup before rolling back the code.

📝 Tag images before every production deploy (`docker tag habbit-runner-api:latest habbit-runner-api:prev`) to make rollback simple.

[↑ Back to top](#top)

---

## 📊 Observability <a name="observability"></a>

**Sync metrics**: `GET /metrics` returns basic sync performance data (counts, timings).

**Logs**: `docker compose logs -f api` — NestJS structured logs include sync op counts and auth events.

**Push subscription cleanup**: A nightly cron in `NotificationModule` removes subscriptions that returned HTTP 410 (gone) or 404 from the push service. Check logs if push delivery drops.

[↑ Back to top](#top)
