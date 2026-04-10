# Grafana Cloud — Metrics (Mimir) Integration

This document describes the minimal setup to forward backend Prometheus metrics
to Grafana Cloud Mimir using a Grafana Agent running on the Docker host.

## Overview

- The backend exposes Prometheus metrics at `/q/metrics` on the management port (127.0.0.1:9000).
- A Grafana Agent running on the host scrapes `localhost:9000/q/metrics` and remote_writes
   to Grafana Cloud Mimir using the `remote_write` configuration.

## 1. Get Mimir credentials from Grafana Cloud

1. Sign in to grafana.com → select your Stack → **Prometheus** → **Details**.
2. Under **Configure remote_write** copy the `url`, `basic_auth.username` and `basic_auth.password`.
3. Create an API token with the `metrics:write` scope and use it as the `basic_auth.password`.

Set these three variables in your repo root `.env` or in the Agent environment file `/etc/grafana-agent.env`:

```env
GRAFANA_MIMIR_URL=https://prometheus-prod-<region>.grafana.net/api/prom/push
GRAFANA_MIMIR_USERNAME=<numeric-instanceId>
GRAFANA_METRICS_API_KEY=<Access Policy token with metrics:write scope>
```

**Security:** do not commit tokens to git. Use a secrets manager, CI secrets, or a restricted `/etc/grafana-agent.env` on the host.

## 2. Deploy the Grafana Agent config

Copy the repository Agent config to the host and make sure the three env vars are available to the Agent process (EnvironmentFile or systemd override):

```bash
sudo cp ops/grafana-agent/agent.yaml /etc/grafana-agent.yaml
sudo tee /etc/grafana-agent.env > /dev/null <<'EOF'
DEPLOYMENT_ENV=production
GRAFANA_MIMIR_URL=${GRAFANA_MIMIR_URL}
GRAFANA_MIMIR_USERNAME=${GRAFANA_MIMIR_USERNAME}
GRAFANA_METRICS_API_KEY=${GRAFANA_METRICS_API_KEY}
EOF

sudo chmod 600 /etc/grafana-agent.env
sudo systemctl daemon-reload
sudo systemctl restart grafana-agent
sudo systemctl status grafana-agent
```

The Agent configuration in `ops/grafana-agent/agent.yaml` is already set to scrape `localhost:9000/q/metrics` and remote_write to `${GRAFANA_MIMIR_URL}` with `basic_auth` using the credentials above.

## 3. Validate metrics

From the host run:

```bash
curl -s http://localhost:9000/q/metrics | head -n 20
```

Then in Grafana Cloud → **Explore** → select **Prometheus / Mimir** datasource and query `{service="habittracker-api"}`.

This document intentionally focuses on metrics only. For traces or logs, add host-side tooling separately.
