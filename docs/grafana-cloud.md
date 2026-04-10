# Grafana Cloud — Observability Setup (Agent-based, Free Tier)

Architecture: Grafana Agent runs on the VPS host alongside the Docker Compose stack.
No OTLP gateway direct push is used — the Agent is the single egress point to Grafana Cloud.

## Architecture diagram

```
  ┌────────────────────────────────────────────────────────────┐
  │  VPS (Docker host)                                         │
  │                                                            │
  │   ┌────────────────────────────┐                           │
  │   │  Docker container: api     │                           │
  │   │  ─────────────────────────│                           │
  │   │  Quarkus HTTP  :8080  ─────┼───(public)──► internet  │
  │   │  Management    :9000  ─────┼──127.0.0.1:9000          │
  │   │  OTLP/gRPC           ─────┼──► host.docker.internal  │
  │   │  stdout (ECS JSON)   ─────┼──► Docker log driver     │
  │   └────────────────────────────┘                           │
  │                                                            │
  │   ┌────────────────────────────────────────────────────┐   │
  │   │  Grafana Agent (systemd)                           │   │
  │   │  ────────────────────────────────────────────────  │   │
  │   │  [metrics]  scrapes localhost:9000/q/metrics       │   │
  │   │  [traces ]  otlp gRPC receiver 0.0.0.0:4317        │   │
  │   │  [logs   ]  tails Docker container via /docker.sock│   │
  │   └──────────┬────────────────┬────────────────┬───────┘   │
  │              │                │                │            │
  └──────────────┼────────────────┼────────────────┼────────────┘
         HTTPS   │         HTTPS  │         HTTPS  │
                 ▼                ▼                ▼
         ┌──────────┐    ┌──────────────┐  ┌────────────┐
         │  Grafana │    │    Grafana   │  │  Grafana   │
         │   Mimir  │    │    Tempo     │  │    Loki    │
         │(metrics) │    │  (traces)    │  │   (logs)   │
         └──────────┘    └──────────────┘  └────────────┘
                  Grafana Cloud (Free Tier)

  Port 9000 — NOT published to 0.0.0.0. Only 127.0.0.1:9000 in docker-compose.
  Port 4317 — Grafana Agent listens on all VPS interfaces for OTLP from container.
```

---

## 1. Get values from the Grafana Cloud UI

### Mimir (metrics — grab remote_write values)

1. UI flow: grafana.com → sign in → **My Account** → select your Stack → **Prometheus** → **Details**.
2. On the "Choose a method for forwarding metrics" screen choose **From my local Prometheus server**. Then under **Configure remote_write** choose **Directly** (Remote write metrics directly from Prometheus to Grafana Cloud).
3. Create or use an API token. When creating a new token select the **metrics:write** scope (preferred for classic Agent). If the UI suggests `set:alloy-data-write` that is Alloy-specific — do not use Alloy-scoped tokens for a classic Agent setup.
4. The UI will show a `remote_write` snippet like this:

   ```yaml
   global:
     scrape_interval: 60s
   remote_write:
     - url: https://prometheus-prod-<region>.grafana.net/api/prom/push
       basic_auth:
         username: 12345678
         password: API_KEY_SECRET
   ```

5. Copy the three values from the snippet and place them into the repository root `.env` (or into the Agent host environment file `/etc/grafana-agent.env`) using these variable names:

   - `GRAFANA_MIMIR_URL` = the `url` value from the snippet (e.g. `https://prometheus-prod-.../api/prom/push`)
   - `GRAFANA_MIMIR_USERNAME` = the `basic_auth.username` numeric value (e.g. `12345678`)
   - `GRAFANA_METRICS_API_KEY` = the `basic_auth.password` token value (e.g. `glc_...`). Use the raw token value — do not base64-encode it.

   Example `.env` lines:

   ```env
   GRAFANA_MIMIR_URL=https://prometheus-prod-65-prod-eu-west-2.grafana.net/api/prom/push
   GRAFANA_MIMIR_USERNAME=12345678
   GRAFANA_METRICS_API_KEY=API_KEY_SECRET
   ```

6. If you run the classic Grafana Agent on the VPS (recommended): add the same three variables to `/etc/grafana-agent.env` (mode 0600) and restart the Agent. The Agent's `remote_write` block uses `basic_auth` with `username: ${GRAFANA_MIMIR_USERNAME}` and `password: ${GRAFANA_METRICS_API_KEY}`.

7. Notes and security:
   - Do NOT commit tokens to git. Store tokens in a secrets manager, CI secret variables, or `/etc/grafana-agent.env` with restricted permissions.
   - The UI-generated snippet is safe to paste into `prometheus.yml` if you run a standalone Prometheus, but for this repository we prefer the Agent-based flow (Agent scrapes `localhost:9000/q/metrics` and remote_writes to Mimir).
   - If the token you generated does not allow writes, recreate it and ensure `metrics:write` is selected.

### Tempo (traces)

1. In the same stack page click **Details** next to **Tempo**.
2. Copy:
   - **OTLP gRPC Endpoint** (format `tempo-prod-<region>-<N>.grafana.net:443`) → `GRAFANA_TEMPO_ENDPOINT`
   - **Username** (numeric) → `GRAFANA_TEMPO_USERNAME`

### Loki (logs)

1. In the same stack page click **Details** next to **Loki**.
2. Copy:
   - **URL** and append `/loki/api/v1/push` → `GRAFANA_LOKI_URL`
   - **Username** (numeric) → `GRAFANA_LOKI_USERNAME`

### API key / Access Policy token

One token can cover all three signals if you add all three scopes:

1. Go to grafana.com → **My Account** → **Access Policies** (left sidebar).
2. Click **Create access policy**.
3. Give it a name (e.g. `habittracker-vps-agent`).
4. Add scopes: `metrics:write`, `traces:write`, `logs:write`.
5. Click **Create**, then **Add token**.
6. Copy the generated token — you will never see it again.
7. Set the same token value in all three variables:
   ```
   GRAFANA_METRICS_API_KEY=<token>
   GRAFANA_TRACES_API_KEY=<token>
   GRAFANA_LOGS_API_KEY=<token>
   ```
   Using one token for all three is fine as long as all required scopes are present.

---

## 2. Configure the Grafana Agent on the VPS

### Install / systemd unit

If the Agent is already installed, locate the config file path:

```bash
sudo systemctl cat grafana-agent | grep '\-\-config'
# Commonly: /etc/grafana-agent.yaml
```

### Deploy the config

```bash
sudo cp ops/grafana-agent/agent.yaml /etc/grafana-agent.yaml
```

### Export credentials before reloading

All `${VAR}` placeholders in `agent.yaml` are resolved by the Agent from its
process environment. Pass them via the systemd override or an EnvironmentFile:

```bash
sudo mkdir -p /etc/systemd/system/grafana-agent.service.d
sudo tee /etc/systemd/system/grafana-agent.service.d/env.conf > /dev/null <<'EOF'
[Service]
EnvironmentFile=/etc/grafana-agent.env
EOF
```

`/etc/grafana-agent.env` (mode 0600, owned by root):

```
ENVIRONMENT=production
GRAFANA_MIMIR_URL=https://prometheus-prod-...grafana.net/api/prom/push
GRAFANA_MIMIR_USERNAME=1234567
GRAFANA_METRICS_API_KEY=glc_...
GRAFANA_TEMPO_ENDPOINT=tempo-prod-...grafana.net:443
GRAFANA_TEMPO_USERNAME=1234568
GRAFANA_TRACES_API_KEY=glc_...
GRAFANA_LOKI_URL=https://logs-prod-...grafana.net/loki/api/v1/push
GRAFANA_LOKI_USERNAME=1234569
GRAFANA_LOGS_API_KEY=glc_...
```

```bash
sudo chmod 600 /etc/grafana-agent.env
sudo systemctl daemon-reload
sudo systemctl restart grafana-agent
sudo systemctl status grafana-agent
```

The Agent user must be in the `docker` group to access `/var/run/docker.sock`:

```bash
sudo usermod -aG docker grafana-agent
sudo systemctl restart grafana-agent
```

---

## 3. Validation checklist

### Metrics

Check the scrape endpoint from the VPS:

```bash
curl -s http://localhost:9000/q/metrics | grep '^jvm_'
```

Expected: lines like `jvm_memory_used_bytes{area="heap",...} 12345678`.

Check data arrived in Grafana Cloud:
1. Open your Grafana stack → **Explore** → select **Prometheus / Mimir** datasource.
2. Run: `{service="habittracker-api"}` or `up{job="habittracker-api"}`.
3. Within ~30 s of first scrape you should see a result.

### Traces

Generate a trace:

```bash
curl -s http://localhost:8080/q/health
# or any application endpoint
```

Verify in Grafana Cloud:
1. **Explore** → select **Tempo** datasource.
2. Switch to **Search** tab.
3. Set **Service Name** = `habittracker-api`.
4. Click **Run query** — spans for the HTTP call should appear within seconds.

### Logs

1. **Explore** → select **Loki** datasource.
2. Query: `{service="habittracker-api"}`.
3. Scroll a log line — confirm the `trace_id` and `span_id` JSON fields are present.

### Loki ↔ Tempo linking (derived fields)

1. Go to **Connections** → **Data Sources** → click the Loki datasource.
2. Scroll to **Derived fields** and click **Add**.
3. Fill in:
   - **Name**: `TraceID`
   - **Regex**: `"trace_id":"([a-f0-9]+)"`
   - **Query**: `${__value.raw}` (Tempo datasource selected)
   - **URL label**: `Open in Tempo`
   - **Internal link**: enabled, datasource = Tempo
4. Save. Now every log line with a `trace_id` will show an **Open in Tempo** button.

---

## 4. Frontend RUM (Faro) — not part of backend deployment

Faro sends data directly from the browser to the Grafana Faro Collector URL.
Configure the `VITE_FARO_*` variables in `.env` and they are baked into the
static bundle at build time. See `.env.example` for all required variables.

---

## 5. What was deliberately excluded and why

- **OTLP gateway direct push** — not guaranteed on Grafana Cloud free tier for metrics;
  agent-scrape is the documented free-tier path.
- **quarkus-micrometer-registry-otlp** — removed; Prometheus scrape via Agent is the
  chosen metrics path and avoids an extra credentials variable in the container environment.
- **OTLP logs export from Quarkus** — `quarkus.otel.logs.exporter=none`; the Agent
  tails Docker stdout which is simpler to operate and avoids placing TLS/auth creds inside the container.
- **Faro / RUM** — frontend-only, not part of backend deployment; see `VITE_FARO_*` in `.env.example`.
- **Alloy** — user explicitly uses classic Grafana Agent; Alloy requires a different River config DSL.
