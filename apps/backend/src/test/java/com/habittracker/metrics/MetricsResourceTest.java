package com.habittracker.metrics;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class MetricsResourceTest {

  @Test
  void shouldReturnZeroedMetricsSnapshotWhenRequested() {
    var metrics = new MetricsResource().getMetrics();

    assertNotNull(Instant.parse((String) metrics.get("createdAt")));
    assertEquals(0, metrics.get("pullRequests"));
    assertEquals(0, metrics.get("pushRequests"));
    assertEquals(0, metrics.get("avgPullLatencyMs"));
    assertEquals(0, metrics.get("avgPushLatencyMs"));
    assertEquals(0, metrics.get("totalPullRows"));
    assertEquals(0, metrics.get("conflicts"));
    assertEquals(0, metrics.get("errors"));
    assertEquals(0, metrics.get("maxOutboxDepth"));
  }
}