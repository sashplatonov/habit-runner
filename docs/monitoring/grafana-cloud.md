# Grafana Cloud Integration

<a name="top"></a>

## 📋 Table of Contents

- [Scope](#scope)
- [End-to-end telemetry flow](#end-to-end-telemetry-flow)
- [Backend metrics and endpoints](#backend-metrics-and-endpoints)
- [Frontend telemetry](#frontend-telemetry)
- [Runtime configuration](#runtime-configuration)
- [Production setup checklist](#production-setup-checklist)
- [Validation after deployment](#validation-after-deployment)

---

## 📡 Scope <a name="scope"></a>

This document describes how the current stack exports metrics to Grafana Cloud for:

- backend service health and sync behavior;
- frontend sync request behavior;
- browser RUM/tracing with Grafana Faro.

[↑ Back to top](#top)

---

## 🔀 End-to-end telemetry flow <a name="end-to-end-telemetry-flow"></a>

1. Backend exposes Prometheus metrics on `/q/metrics`.
2. Frontend emits sync metrics to backend endpoint `/metrics/frontend`.
3. Backend converts those frontend events into Micrometer metrics, also visible on `/q/metrics`.
4. Grafana Agent/Alloy (or another Prometheus-compatible scraper) scrapes `/q/metrics` and remote_writes to Grafana Cloud Prometheus.
5. Frontend Faro SDK sends browser signals directly to Grafana Faro endpoint.
6. Backend traces can be exported with OTLP via `OTEL_EXPORTER_OTLP_*`.

[↑ Back to top](#top)

---

## 📈 Backend metrics and endpoints <a name="backend-metrics-and-endpoints"></a>

Endpoints:

- `/q/metrics`: Prometheus/Micrometer scrape endpoint.
- `/q/health`: health checks.
- `/metrics`: lightweight JSON snapshot for sync aggregate counters.
- `/metrics/frontend`: frontend metric ingestion endpoint.

Main sync metrics from backend collector:

- `habittracker_sync_pull_requests_total`
- `habittracker_sync_push_requests_total`
- `habittracker_sync_pull_rows_total`
- `habittracker_sync_conflicts_total`
- `habittracker_sync_errors_total`
- `habittracker_sync_pull_latency`
- `habittracker_sync_push_latency`
- `habittracker_sync_max_outbox_depth`

Main frontend-ingested metrics (exported by backend):

- `habittracker_frontend_metrics_ingested_total`
- `habittracker_frontend_metrics_rejected_total`
- `habittracker_frontend_metric_events_total`
- `habittracker_frontend_metric_value`
- `habittracker_frontend_metric_status_total`

[↑ Back to top](#top)

---

## 🌐 Frontend telemetry <a name="frontend-telemetry"></a>

Frontend now emits sync telemetry for pull/push requests:

- `sync_http_request_total` (count)
- `sync_http_duration_ms` (milliseconds)
- `sync_server_duration_ms` (milliseconds, when server timing is available)

Transport details:

- Uses `navigator.sendBeacon(...)` when available.
- Falls back to `fetch(..., { keepalive: true })`.
- Controlled by `VITE_FRONTEND_METRICS_ENABLED` (default enabled).

RUM/tracing details:

- Faro initialization is controlled by `VITE_FARO_*` variables.

[↑ Back to top](#top)

---

## ⚙️ Runtime configuration <a name="runtime-configuration"></a>

Backend environment:

- `API_PORT`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SCHEMA`
- `CORS_ORIGINS`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_EXPORTER_OTLP_HEADERS`
- `OTEL_RESOURCE_ATTRIBUTES`

Frontend environment:

- `VITE_API_BASE_URL`
- `VITE_FRONTEND_METRICS_ENABLED`
- `VITE_FARO_URL`
- `VITE_FARO_API_KEY`
- `VITE_FARO_APP_NAME`
- `VITE_FARO_APP_VERSION`
- `VITE_FARO_ENVIRONMENT`
- `VITE_FARO_SAMPLING_RATE`
- `VITE_FARO_PERSISTENT_SESSIONS`

Keep all secrets out of the repository and inject them via deployment platform secret management.

[↑ Back to top](#top)

---

## ✅ Production setup checklist <a name="production-setup-checklist"></a>

1. Set backend and frontend observability environment variables in your deployment platform.
2. Expose backend `/q/metrics` to your internal scraper (Grafana Agent/Alloy/Prometheus).
3. Configure remote_write from scraper to Grafana Cloud Prometheus.
4. Set Faro endpoint and keys in frontend runtime variables.
5. Keep `VITE_FRONTEND_METRICS_ENABLED=true` to send frontend sync events to backend ingestion endpoint.
6. Ensure network policy and ingress allow frontend to call backend `/metrics/frontend`.
7. Restrict public access to scrape endpoints (`/q/metrics`) using network boundaries, auth proxy, or private networking.

[↑ Back to top](#top)

---

## 🔍 Validation after deployment <a name="validation-after-deployment"></a>

Perform these checks right after rollout:

1. `GET /q/health` returns healthy state.
2. `GET /q/metrics` includes both `habittracker_sync_*` and `habittracker_frontend_*` metrics.
3. Trigger a frontend sync and verify counters increase:
   - `habittracker_sync_pull_requests_total` or `habittracker_sync_push_requests_total`
   - `habittracker_frontend_metric_events_total`
4. Confirm Faro events and traces appear in Grafana Cloud.

[↑ Back to top](#top)
