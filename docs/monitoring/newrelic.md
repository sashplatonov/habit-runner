# Backend Observability Contract (New Relic)

<a name="top"></a>

## 📋 Table of Contents

- [🎯 Scope](#scope)
- [✅ Backend contract](#backend-contract)
- [📊 Dashboard-ready SLO view](#dashboard-ready-slo-view)
- [🔐 Required environment variables](#required-environment-variables)
- [🚀 Runtime modes](#runtime-modes)
- [🧪 Validate](#validate)

New Relic is the primary backend observability path for this repository.

- Backend JVM/HTTP telemetry and custom meters use the Micrometer New Relic registry when explicitly enabled
- The packaged Java agent is an independent opt-in APM integration and is attached only when `NEW_RELIC_AGENT_ENABLED=true`
- JSON ECS logs stay on stdout and carry `trace_id`, `span_id`, `service.name`, and `deployment.environment`; `span_id` is populated only when an OTel span is active
- Request correlation uses `x-trace-id` inbound and propagates to outbound HTTP calls
- Browser observability is optional and only enabled when the frontend build-time New Relic browser config is present
- The backend does not expose a Grafana/Prometheus path anymore

[↑ Back to top](#top)

## 🎯 Scope <a name="scope"></a>

- Backend health, Micrometer metrics, logs, and trace-ID correlation for `habittracker-api`
- Runtime knobs that affect backend visibility in New Relic
- Only the active New Relic contract is documented here

[↑ Back to top](#top)

## ✅ Backend contract <a name="backend-contract"></a>

The backend observability contract is intentionally small and explicit:

- health endpoints:
  - `/q/health`
  - `/q/health/ready`
- request correlation:
  - inbound header: `x-trace-id`
  - MDC key: `traceId`
  - JSON log fields: `trace_id`, `span_id`
- log metadata:
  - `service.name=habittracker-api`
  - `deployment.environment=${DEPLOYMENT_ENV}`
- outbound correlation:
  - OAuth and other slow-path HTTP calls reuse the active `traceId` when present

### Ingress boundary

Quarkus owns the health resources, while the web container owns the only
browser-facing ingress:

| Surface | Local Compose | Dokploy overlay | Audience |
|---|---|---|---|
| `/q/health/live` | API-container healthcheck and `/api/q/health/live` through nginx | `/api/q/health/live` through the web service and configured domain | liveness/probe tooling; no authentication |
| `/q/health/ready` | API-container healthcheck and `/api/q/health/ready` through nginx | `/api/q/health/ready` through the web service and configured domain | readiness/probe tooling; no authentication |
| `/q/health` | Available at the same internal API path and nginx `/api` proxy | Available through the web service `/api` proxy | combined health inspection |
| Metrics | No public HTTP metrics endpoint; Micrometer exports outbound to New Relic only when enabled | Same; the overlay does not route a metrics path | New Relic backend telemetry |

The default Compose `api` service uses `expose`, not `ports`, so it has no host
API port. Nginx forwards `/api/...` to the internal API service and strips the
`/api` prefix. The Dokploy file attaches `web` to the external routing network
and keeps the API behind that web proxy; it does not publish a separate API or
metrics port. A deployed router may therefore reach the health paths through
the configured web domain, but no deployment claim should treat metrics as a
public endpoint.

Local checks intentionally discard response bodies:

```bash
docker compose --env-file .env.example --profile db up -d --build --wait
curl -fsS -o /dev/null -w 'web live HTTP %{http_code}\n' http://localhost:5137/api/q/health/live
curl -fsS -o /dev/null -w 'web ready HTTP %{http_code}\n' http://localhost:5137/api/q/health/ready
docker compose --env-file .env.example --profile db exec -T api \
  wget -q -O /dev/null http://127.0.0.1:8080/q/health/ready
```

These commands prove local routing and container readiness only. A deployed
health response requires a fresh check against the actual Dokploy domain and
router configuration; it is separate from local Compose proof.

New Relic dashboards should be built from:

- APM service/entity health only when the Java agent is enabled
- JVM and HTTP telemetry
- log search by `traceId`, `service.name`, and `deployment.environment`
- custom business metrics from `apps/backend/src/main/java/com/sashplatonov/habbit/runner/metrics/instrumentation/ServiceMetricsInstrumentation.java` are exported through the New Relic Micrometer registry only when `NEW_RELIC_METRICS_ENABLED=true`

### Business KPI set

Use these metric names for dashboard aggregation:

- `habittracker.habit.created`
- `habittracker.habit.updated`
- `habittracker.habit.deleted`
- `habittracker.checkin.upserted`
- `habittracker.checkin.deleted`
- `habittracker.auth.login.success`
- `habittracker.auth.refresh.success`
- `habittracker.oauth.google.exchange.latency`
- `habittracker.oauth.google.failure`
- `habittracker.push.subscription.created`
- `habittracker.push.subscription.deleted`

Stable tags:

- `deployment.environment`
- `operation`
- `outcome`
- `provider`

Dashboard queries should avoid raw `userId`, email, endpoint, or any other high-cardinality identifier.

[↑ Back to top](#top)

## 📊 Dashboard-ready SLO view <a name="dashboard-ready-slo-view"></a>

Use the following panels as the backend SLO entrypoint in New Relic:

### Latency

- `habittracker.mutations.request.roundtrip` for write-path latency across habit and checkin use cases
- `habittracker.oauth.google.exchange.latency` for the external OAuth boundary

Suggested breakdowns:

- `metricName`
- `operation`
- `provider`
- `deployment.environment`

### Error rate

- `habittracker.oauth.google.failure`
- HTTP 4xx/5xx telemetry for habit and checkin request paths when a dedicated failure counter is not emitted

Suggested breakdowns:

- `operation`
- `provider`
- `deployment.environment`

### Traffic

- `habittracker.habit.created`
- `habittracker.habit.updated`
- `habittracker.habit.deleted`
- `habittracker.checkin.upserted`
- `habittracker.checkin.deleted`
- `habittracker.auth.login.success`
- `habittracker.auth.refresh.success`
- `habittracker.push.subscription.created`
- `habittracker.push.subscription.deleted`

Panel rule:

- keep the view faceted by the stable tags only and exclude raw identifiers from any dashboard query

[↑ Back to top](#top)

## 🔐 Required environment variables <a name="required-environment-variables"></a>

Backend runtime:

- `NEW_RELIC_METRICS_ENABLED=false`
- `NEW_RELIC_LICENSE_KEY` (required when metrics export is enabled)
- `NEW_RELIC_APP_NAME=habittracker-api`
- `NEW_RELIC_AGENT_ENABLED=false` (set to `true` only to attach the packaged Java agent)
- `NEW_RELIC_APPLICATION_LOGGING_FORWARDING_ENABLED=false`
- `NEW_RELIC_APPLICATION_LOGGING_FORWARDING_MAX_SAMPLES_STORED=10000`
- `NEW_RELIC_APPLICATION_LOGGING_LOCAL_DECORATING_ENABLED=false`
- `APP_VERSION`
- `SERVICE_VERSION`
- `DEPLOYMENT_ENV`

Frontend browser observability:

- `VITE_NEW_RELIC_BROWSER_ENABLED=false`
- `VITE_NEW_RELIC_BROWSER_INFO`
- `VITE_NEW_RELIC_BROWSER_INIT`
- `VITE_NEW_RELIC_BROWSER_LOADER_CONFIG`

Notes:

- keep the license key out of git
- browser config is build-time data for the frontend image, so populate it before `apps/web` is built
- keep forwarding off until the log-volume review says the stack is safe for the chosen plan
- keep local decorating off when forwarding is on

[↑ Back to top](#top)

## 🚀 Runtime modes <a name="runtime-modes"></a>

1. `NEW_RELIC_METRICS_ENABLED=false`
   - local default
   - no remote metrics export is attempted
2. `NEW_RELIC_METRICS_ENABLED=true` with a license key
   - Micrometer exports JVM and HTTP metrics
   - can be enabled independently from the Java agent
3. `NEW_RELIC_AGENT_ENABLED=true` with a license key
   - attaches the packaged Java agent and enables APM entity telemetry
   - does not enable Micrometer export or log forwarding by itself
4. `quarkus.otel.enabled=true` with a configured OTLP receiver
   - enables distributed tracing only after an end-to-end receiver test
   - remains disabled by default in this repository
5. browser config present with `VITE_NEW_RELIC_BROWSER_ENABLED=true`
   - browser page views, JS errors, and client logs are enabled
   - configure from the Browser app snippet before building the web image
6. `NEW_RELIC_APPLICATION_LOGGING_FORWARDING_ENABLED=true`
   - not enabled by the repository defaults
   - only after log-volume review and an explicit New Relic deployment decision

[↑ Back to top](#top)

## 🧪 Validate <a name="validate"></a>

```bash
docker compose --profile db config --quiet
docker compose --profile db up --build --wait
```

Checks:

- backend metric entity appears in New Relic after metrics export is enabled with a valid license key
- backend APM entity appears only after the Java agent is enabled with a valid license key
- browser entity appears in New Relic Browser after opening the web app
- logs contain `traceId`, `service.name`, and `deployment.environment`
- custom business KPI metrics appear in New Relic `Metric` data after export intervals when metrics export is enabled
- the backend health endpoints still respond from the compose stack

[↑ Back to top](#top)
