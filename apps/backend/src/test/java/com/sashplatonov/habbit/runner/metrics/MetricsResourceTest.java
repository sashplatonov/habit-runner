package com.sashplatonov.habbit.runner.metrics;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class MetricsResourceTest {

  @Test
  @SuppressWarnings("PMD.LawOfDemeter")
  void shouldReturnCollectedSyncMetricsSnapshotWhenRequested() {
    var registry = new SimpleMeterRegistry();
    var syncMetricsCollector = new SyncMetricsCollector(registry);
    syncMetricsCollector.recordPull(120, 5);
    syncMetricsCollector.recordPush(80, 3, 1);
    var response = new MetricsResource(syncMetricsCollector).getMetrics();
    var metrics = (MetricsSnapshotDto) response.getEntity();

    assertEquals(200, response.getStatus());
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