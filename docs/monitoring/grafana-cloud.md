# Grafana Cloud — Metrics (Mimir) Integration

This document describes how to export backend Prometheus metrics to Grafana Cloud
Mimir using a Grafana Agent running on the Docker host.

## Scope

- Backend metrics (Prometheus `/q/metrics`) scraped by a host-side Grafana Agent.
- Remote-write of scraped metrics to Grafana Cloud Mimir.

## End-to-end flow

1. Backend exposes Prometheus metrics at `127.0.0.1:9000/q/metrics`.
2. Grafana Agent on the host scrapes `localhost:9000/q/metrics` and remote_writes
   to `${GRAFANA_MIMIR_URL}` using `basic_auth` with `${GRAFANA_MIMIR_USERNAME}` and `${GRAFANA_METRICS_API_KEY}`.

## Backend metrics and endpoints

- `/q/metrics`: Prometheus/Micrometer scrape endpoint.
- `/q/health`: health checks.

Key sync metrics are exported under `habittracker_sync_*` and frontend-injected
metrics under `habittracker_frontend_*`.

## Runtime configuration (minimal)

Backend environment (important):
   - `API_PORT`
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SCHEMA`
   - `APP_VERSION` (optional; previously `SERVICE_VERSION`)
   - `DEPLOYMENT_ENV` (optional; previously `ENVIRONMENT`)

Grafana Cloud metrics vars (set these on the host for the Agent):
- `GRAFANA_MIMIR_URL`
- `GRAFANA_MIMIR_USERNAME`
- `GRAFANA_METRICS_API_KEY`

## Deploying the Grafana Agent

The repository includes an example Agent config at `ops/grafana-agent/agent.yaml`.
Copy it to the host (e.g. `/etc/grafana-agent.yaml`) and provide the three credentials via
an EnvironmentFile (e.g. `/etc/grafana-agent.env`, mode 0600).

## Validation

From the host run:

```bash
curl -s http://localhost:9000/q/metrics | head -n 20
```

Then in Grafana Cloud → **Explore** → select **Prometheus / Mimir** and query `{service="habittracker-api"}`.

This document intentionally focuses on metrics only. If you later want traces or logs,
those require additional configuration and credentials and are documented separately.
