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

- Backend APM, JVM telemetry, and logs-in-context go through the Java agent in `apps/backend`
- JSON ECS logs stay on stdout and carry `trace_id`, `span_id`, `service.name`, and `deployment.environment`
- Request correlation uses `x-trace-id` inbound and propagates to outbound HTTP calls
- Browser observability is optional and only enabled when the frontend build-time New Relic browser config is present
- The backend does not expose a Grafana/Prometheus path anymore

[↑ Back to top](#top)

## 🎯 Scope <a name="scope"></a>

- Backend health, metrics, logs, and trace correlation for `habittracker-api`
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

New Relic dashboards should be built from:

- APM service/entity health
- JVM and HTTP telemetry
- log search by `traceId`, `service.name`, and `deployment.environment`
- custom business metrics from `apps/backend/src/main/java/com/sashplatonov/habbit/runner/metrics/instrumentation/ServiceMetricsInstrumentation.java` are exported through the New Relic Micrometer registry

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

- `NEW_RELIC_LICENSE_KEY`
- `NEW_RELIC_APP_NAME=habittracker-api`
- `NEW_RELIC_AGENT_ENABLED=false`
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

1. `NEW_RELIC_AGENT_ENABLED=false`
   - local default
   - backend runs without agent attachment
2. `NEW_RELIC_AGENT_ENABLED=true` with forwarding off
   - APM, JVM telemetry, and logs-in-context only
   - safe first rollout mode
3. browser config present with `VITE_NEW_RELIC_BROWSER_ENABLED=true`
   - browser page views, JS errors, and client logs are enabled
   - configure from the Browser app snippet before building the web image
4. `NEW_RELIC_AGENT_ENABLED=true` with forwarding on
   - only after log-volume review
   - keep `debug,trace` denied
   - keep the sample cap explicit

[↑ Back to top](#top)

## 🧪 Validate <a name="validate"></a>

```bash
cd habbit-runner
docker compose --env-file .env.example config
docker compose --env-file .env.example --profile db up --build
```

Checks:

- backend entity appears in New Relic APM
- browser entity appears in New Relic Browser after opening the web app
- logs contain `traceId`, `service.name`, and `deployment.environment`
- custom business KPI metrics appear in New Relic `Metric` data after a few scrape intervals
- the backend health endpoints still respond from the compose stack

[↑ Back to top](#top)
