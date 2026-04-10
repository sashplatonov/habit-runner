package com.habittracker.metrics;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FrontendMetricsCollectorTest {

  @Test
  void shouldIngestValidFrontendMetricPayload() {
    var registry = new SimpleMeterRegistry();
    var collector = new FrontendMetricsCollector(registry);

    collector.record(new FrontendMetricDto("sync_http_duration_ms", 123.0d, "ms", "pull", 200, true));

    var accepted = registry.find("habittracker_frontend_metrics_ingested_total").counter();
    var events = registry.find("habittracker_frontend_metric_events_total")
        .tag("metric_name", "sync_http_duration_ms")
        .tag("operation", "pull")
        .tag("outcome", "success")
        .counter();
    var statusFamily = registry.find("habittracker_frontend_metric_status_total")
        .tag("metric_name", "sync_http_duration_ms")
        .tag("status_family", "2xx")
        .counter();

    assertEquals(1.0d, accepted != null ? accepted.count() : 0.0d);
    assertEquals(1.0d, events != null ? events.count() : 0.0d);
    assertEquals(1.0d, statusFamily != null ? statusFamily.count() : 0.0d);
  }

  @Test
  void shouldRejectInvalidFrontendMetricPayload() {
    var registry = new SimpleMeterRegistry();
    var collector = new FrontendMetricsCollector(registry);

    collector.record(new FrontendMetricDto("", Double.NaN, "ms", "pull", 200, true));

    var rejected = registry.find("habittracker_frontend_metrics_rejected_total").counter();
    var accepted = registry.find("habittracker_frontend_metrics_ingested_total").counter();

    assertEquals(1.0d, rejected != null ? rejected.count() : 0.0d);
    assertEquals(0.0d, accepted != null ? accepted.count() : 0.0d);
  }
}