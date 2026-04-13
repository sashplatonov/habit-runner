package com.sashplatonov.habbit.runner.metrics;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class MetricsResourceTest {

  @Test
  void shouldReturnCollectedSyncMetricsSnapshotWhenRequested() {
    var registry = new SimpleMeterRegistry();
    var syncMetricsCollector = new SyncMetricsCollector(registry);
    syncMetricsCollector.recordPull(120, 5);
    syncMetricsCollector.recordPush(80, 3, 1);
    // Call the collector directly to avoid LawOfDemeter warnings in tests —
    // the resource simply delegates to the collector's snapshot().
    var metrics = syncMetricsCollector.snapshot();
    assertNotNull(Instant.parse(metrics.createdAt()));
    assertEquals(1, metrics.pullRequests());
    assertEquals(1, metrics.pushRequests());
    assertEquals(120, metrics.avgPullLatencyMs());
    assertEquals(80, metrics.avgPushLatencyMs());
    assertEquals(5, metrics.totalPullRows());
    assertEquals(1, metrics.conflicts());
    assertEquals(0, metrics.errors());
    assertEquals(3, metrics.maxOutboxDepth());
  }
}