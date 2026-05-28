# Grafana Cloud Integration (Faro + Alloy Sidecar) <a name="top"></a>

## Table of Contents
- [🎯 Scope](#scope)
- [🔁 End-to-End Flow](#end-to-end-flow)
- [🔐 Required Environment Variables](#required-environment-variables)
- [🚀 Run](#run)
- [🧪 Validate](#validate)

This repository used to use:
- frontend RUM sent directly to Grafana Faro (F1),
- backend Prometheus metrics scraped by an Alloy sidecar in docker-compose and pushed to Grafana Cloud Mimir (B3).

New Relic is the default backend observability path. Treat this document as the legacy/optional Grafana path only and do not enable both defaults together.

## 🎯 Scope <a name="scope"></a>

- Frontend: direct browser telemetry to Faro.
- Backend: `/q/metrics` scraped by the legacy sidecar collector.
- No host-level Grafana Agent setup required for the legacy path.

[↑ Back to top](#top)

## 🔁 End-to-End Flow <a name="end-to-end-flow"></a>

1. `web` is built with `VITE_FARO_*` values and sends RUM data directly to Faro.
2. `api` exposes Prometheus metrics on `api:9000/q/metrics` inside compose.
3. `alloy` sidecar scrapes `api:9000/q/metrics` and remote_writes to Mimir using:
   - `GRAFANA_MIMIR_URL`
   - `GRAFANA_MIMIR_USERNAME`
   - `GRAFANA_METRICS_API_KEY`

If New Relic is enabled, keep this path disabled unless you are intentionally operating the legacy metrics pipeline.

[↑ Back to top](#top)

## 🔐 Required Environment Variables <a name="required-environment-variables"></a>

Frontend Faro (build-time):
- `VITE_FARO_URL`
- `VITE_FARO_APP_NAME`
- `VITE_FARO_APP_VERSION`
- `VITE_FARO_ENVIRONMENT`
- `VITE_FARO_SAMPLING_RATE`
- `VITE_FARO_PERSISTENT_SESSIONS`
- `VITE_FARO_ENABLED`

Backend metrics remote write (runtime):
- `GRAFANA_MIMIR_URL`
- `GRAFANA_MIMIR_USERNAME`
- `GRAFANA_METRICS_API_KEY`

[↑ Back to top](#top)

## 🚀 Run <a name="run"></a>

```bash
docker compose --profile db up --build
```

After startup:
- `api` and `web` run as usual,
- `alloy` starts automatically and begins scraping/pushing metrics.

[↑ Back to top](#top)

## 🧪 Validate <a name="validate"></a>

Check sidecar health and scrape state from the `api` container:

```bash
docker compose exec -T api curl -sf http://alloy:12345/-/ready
docker compose exec -T api sh -lc "curl -sf http://alloy:12345/metrics | grep -E 'prometheus_remote_storage_(samples_pending|succeeded_samples_total)|up\\{[^}]*job=\"habbit-runner-api\"' | head -n 20"
```

Validate backend scrape endpoint:

```bash
docker compose exec -T api curl -sf http://127.0.0.1:9000/q/metrics | head -n 20
```

In Grafana Cloud Explore (Prometheus/Mimir), query:

```text
{service="habittracker-api"}
```

For frontend RUM, use Grafana Faro Explore views for your `VITE_FARO_APP_NAME` and `VITE_FARO_ENVIRONMENT`.

[↑ Back to top](#top)
