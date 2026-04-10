package com.habittracker.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.DistributionSummary;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Locale;

@ApplicationScoped
public class FrontendMetricsCollector {
  private static final String UNKNOWN = "unknown";
  private static final int MAX_TAG_VALUE_LENGTH = 40;

  private final MeterRegistry meterRegistry;
  private final Counter acceptedCounter;
  private final Counter rejectedCounter;

  public FrontendMetricsCollector(MeterRegistry meterRegistry) {
    this.meterRegistry = meterRegistry;
    acceptedCounter = Counter.builder("habittracker_frontend_metrics_ingested_total")
        .description("Accepted frontend metrics payloads")
        .register(meterRegistry);
    rejectedCounter = Counter.builder("habittracker_frontend_metrics_rejected_total")
        .description("Rejected frontend metrics payloads")
        .register(meterRegistry);
  }

  public void record(FrontendMetricDto payload) {
    if (!isValidPayload(payload)) {
      rejectedCounter.increment();
      return;
    }

    var metricName = sanitizeTag(payload.name(), UNKNOWN);
    var operation = sanitizeTag(payload.operation(), UNKNOWN);
    var outcome = outcome(payload.success());
    var safeValue = Math.max(payload.value(), 0.0d);

    Counter.builder("habittracker_frontend_metric_events_total")
        .description("Frontend metric events by metric name")
        .tag("metric_name", metricName)
        .tag("operation", operation)
        .tag("outcome", outcome)
        .register(meterRegistry)
        .increment();

    DistributionSummary.builder("habittracker_frontend_metric_value")
        .description("Frontend metric values")
        .baseUnit(normalizeUnit(payload.unit()))
        .tag("metric_name", metricName)
        .tag("operation", operation)
        .tag("outcome", outcome)
        .register(meterRegistry)
        .record(safeValue);

    if (payload.status() != null) {
      Counter.builder("habittracker_frontend_metric_status_total")
          .description("Frontend metric events grouped by HTTP status family")
          .tag("metric_name", metricName)
          .tag("status_family", toStatusFamily(payload.status()))
          .register(meterRegistry)
          .increment();
    }

    acceptedCounter.increment();
  }

  private boolean isValidPayload(FrontendMetricDto payload) {
    return payload != null
        && payload.name() != null
        && !payload.name().isBlank()
        && payload.value() != null
        && Double.isFinite(payload.value());
  }

  private String outcome(Boolean success) {
    if (Boolean.TRUE.equals(success)) {
      return "success";
    }
    if (Boolean.FALSE.equals(success)) {
      return "error";
    }
    return UNKNOWN;
  }

  private String normalizeUnit(String unit) {
    if (unit == null || unit.isBlank()) {
      return "count";
    }
    return sanitizeTag(unit, "count");
  }

  private String toStatusFamily(int statusCode) {
    if (statusCode >= 500) {
      return "5xx";
    }
    if (statusCode >= 400) {
      return "4xx";
    }
    if (statusCode >= 300) {
      return "3xx";
    }
    if (statusCode >= 200) {
      return "2xx";
    }
    if (statusCode >= 100) {
      return "1xx";
    }
    return "other";
  }

  private String sanitizeTag(String rawValue, String fallback) {
    if (rawValue == null) {
      return fallback;
    }

    var normalized = rawValue.trim().toLowerCase(Locale.ROOT);
    if (normalized.isBlank()) {
      return fallback;
    }

    var builder = new StringBuilder(normalized.length());
    for (var i = 0; i < normalized.length(); i++) {
      var ch = normalized.charAt(i);
      if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '_' || ch == '-' || ch == '.') {
        builder.append(ch);
      } else {
        builder.append('_');
      }
      if (builder.length() >= MAX_TAG_VALUE_LENGTH) {
        break;
      }
    }

    if (builder.isEmpty()) {
      return fallback;
    }
    return builder.toString();
  }
}