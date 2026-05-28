# New Relic Monitoring

<a name="top"></a>

## Table of Contents

- [🎯 Scope](#scope)
- [🔐 Required Environment Variables](#required-environment-variables)
- [🚀 Runtime Modes](#runtime-modes)
- [🧪 Validate](#validate)

This repo uses New Relic as the default backend observability path:

- Java agent inside `apps/backend`
- JSON ECS logs on stdout
- log forwarding stays disabled until the log volume review is done
- Grafana Alloy remains optional legacy tooling for the old metrics path only

[↑ Back to top](#top)

## 🎯 Scope <a name="scope"></a>

- Backend APM, JVM telemetry, and logs-in-context for `habittracker-api`
- no second default log pipeline
- legacy Alloy/Mimir assets are optional and should not be enabled in parallel with the New Relic default path

[↑ Back to top](#top)

## 🔐 Required Environment Variables <a name="required-environment-variables"></a>

Runtime:

- `NEW_RELIC_LICENSE_KEY`
- `NEW_RELIC_APP_NAME=habittracker-api`
- `NEW_RELIC_AGENT_ENABLED=false`
- `DEPLOYMENT_ENV=development`
- `NEW_RELIC_APPLICATION_LOGGING_FORWARDING_ENABLED=false`
- `NEW_RELIC_APPLICATION_LOGGING_FORWARDING_MAX_SAMPLES_STORED=10000`
- `NEW_RELIC_APPLICATION_LOGGING_LOCAL_DECORATING_ENABLED=false`

Notes:

- keep the license key out of git
- keep forwarding off until the log volume review says the stack is safe for the free plan
- keep local decorating off when forwarding is on
- Quarkus does not expose the servlet-container JMX pool set that powers the built-in APM `Threads` tab, so the image now ships a custom JMX extension under `/opt/newrelic/extensions`.
- Query custom JVM/thread metrics in New Relic from the `Metric` event with names like `JMX/Runtime/Threads/ThreadCount`.

[↑ Back to top](#top)

## 🚀 Runtime Modes <a name="runtime-modes"></a>

1. `NEW_RELIC_AGENT_ENABLED=false`
   - default local mode
   - no agent attachment
2. `NEW_RELIC_AGENT_ENABLED=true` with forwarding off
   - first rollout mode
   - APM and JVM telemetry only
3. `NEW_RELIC_AGENT_ENABLED=true` with forwarding on
   - only after log volume review
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
- custom thread metrics appear in New Relic `Metric` data after a few scrape intervals
- logs include the application name and deployment environment
- Alloy documentation remains clearly marked as optional/legacy

[↑ Back to top](#top)
