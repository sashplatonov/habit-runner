package com.habittracker.metrics;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class MetricsResourceTest {

  @Test
  @SuppressWarnings("PMD.LawOfDemeter")
  void shouldReturnZeroedMetricsSnapshotWhenRequested() {
    var metrics = new MetricsResource().getMetrics();

    assertNotNull(Instant.parse(metrics.createdAt()));
    assertEquals(0, metrics.pullRequests());
    assertEquals(0, metrics.pushRequests());
    assertEquals(0, metrics.avgPullLatencyMs());
    assertEquals(0, metrics.avgPushLatencyMs());
    assertEquals(0, metrics.totalPullRows());
    assertEquals(0, metrics.conflicts());
    assertEquals(0, metrics.errors());
    assertEquals(0, metrics.maxOutboxDepth());
  }
}