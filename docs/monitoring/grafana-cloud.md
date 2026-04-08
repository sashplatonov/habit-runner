# Grafana Cloud integration (backend)

This document describes how to connect the Java backend to Grafana Cloud for metrics, traces and logs.

## Overview
- Metrics: application exposes Prometheus metrics at `/q/metrics`. You can scrape these with Grafana Agent or use OTLP metrics export.
- Traces: OpenTelemetry (OTLP) exporter is enabled; configure your Grafana Cloud OTLP endpoint and API key.
- Logs: recommended: run Grafana Agent / Promtail on the host and forward stdout or log files to the agent. Optional: the project includes a `logback.xml` that can push directly to Loki (requires credentials).

## Required environment variables (DO NOT commit secrets)
- `OTEL_EXPORTER_OTLP_ENDPOINT` — Grafana Cloud OTLP endpoint (e.g. `https://otlp-gateway-prod-1.grafana.net:4317`)
- `OTEL_EXPORTER_OTLP_HEADERS` — e.g. `Authorization=Bearer <API_KEY>`
- `OTEL_RESOURCE_ATTRIBUTES` — e.g. `service.name=server-java,service.instance.id=<id>`
- `GRAFANA_CLOUD_API_KEY` — API key for Loki (if using `logback.xml` Loki appender)
- `LOKI_PUSH_URL` — Loki push URL (if using `logback.xml`)

## Docker run example
```bash
docker build -t habbit-backend:local apps/backend
docker run -e OTEL_EXPORTER_OTLP_ENDPOINT="$OTEL_EXPORTER_OTLP_ENDPOINT" \\
  -e OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer $GRAFANA_CLOUD_API_KEY" \\
  -e OTEL_RESOURCE_ATTRIBUTES="service.name=server-java" \\
  -e LOKI_PUSH_URL="$LOKI_PUSH_URL" \\
  -e GRAFANA_CLOUD_API_KEY="$GRAFANA_CLOUD_API_KEY" \\
  -p 3000:3000 habbit-backend:local
```

## Recommended: run Grafana Agent
Prefer deploying Grafana Agent (scraping /q/metrics, collecting logs and forwarding traces) rather than sending logs directly from the app. See Grafana Cloud docs for the proper agent configuration for your stack.
