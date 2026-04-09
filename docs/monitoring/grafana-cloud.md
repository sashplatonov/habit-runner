# Grafana Cloud Integration

<a name="top"></a>

## 📋 Table of Contents

- [Scope](#scope)
- [Current backend signals](#current-backend-signals)
- [Runtime configuration](#runtime-configuration)
- [Container example](#container-example)
- [Operational notes](#operational-notes)

---

## 📡 Scope <a name="scope"></a>

This document covers backend-side Grafana Cloud integration for the current Quarkus service in `apps/backend`.

[↑ Back to top](#top)

---

## 📈 Current backend signals <a name="current-backend-signals"></a>

Available endpoints:
- `/q/metrics` for Prometheus/Micrometer scraping;
- `/q/health` for health monitoring;
- `/metrics` for a lightweight JSON metrics payload;
- Quarkus logs from the backend container or local process.

Current backend config also includes `logback.xml`, which can be adapted for log shipping if needed.

[↑ Back to top](#top)

---

## ⚙️ Runtime configuration <a name="runtime-configuration"></a>

Typical environment variables:
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_EXPORTER_OTLP_HEADERS`
- `OTEL_RESOURCE_ATTRIBUTES`
- `GRAFANA_CLOUD_API_KEY`
- `LOKI_PUSH_URL`

Keep secrets out of the repository and inject them through your deployment platform or local shell environment.

[↑ Back to top](#top)

---

## 🐳 Container example <a name="container-example"></a>

```bash
docker build -t habbit-backend:local -f apps/backend/Dockerfile.jvm apps/backend

docker run \
  -e OTEL_EXPORTER_OTLP_ENDPOINT="$OTEL_EXPORTER_OTLP_ENDPOINT" \
  -e OTEL_EXPORTER_OTLP_HEADERS="$OTEL_EXPORTER_OTLP_HEADERS" \
  -e OTEL_RESOURCE_ATTRIBUTES="service.name=habbit-runner-backend" \
  -e LOKI_PUSH_URL="$LOKI_PUSH_URL" \
  -e GRAFANA_CLOUD_API_KEY="$GRAFANA_CLOUD_API_KEY" \
  -e DB_HOST="$DB_HOST" \
  -e DB_PORT="$DB_PORT" \
  -e DB_NAME="$DB_NAME" \
  -e DB_USER="$DB_USER" \
  -e DB_PASSWORD="$DB_PASSWORD" \
  -e DB_SCHEMA="$DB_SCHEMA" \
  -e API_PORT=8080 \
  -p 8080:8080 \
  habbit-backend:local
```

[↑ Back to top](#top)

---

## 📝 Operational notes <a name="operational-notes"></a>

- Prefer a collector or agent when you need unified metrics, traces, and logs across environments.
- If you wire direct Loki shipping through `logback.xml`, document the secret and retry strategy outside the repo.
- After adding observability config, verify both `/q/health` and `/q/metrics` before treating the deployment as healthy.

[↑ Back to top](#top)
