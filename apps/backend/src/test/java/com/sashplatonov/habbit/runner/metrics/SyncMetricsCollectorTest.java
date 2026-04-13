package com.sashplatonov.habbit.runner.metrics;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SyncMetricsCollectorTest {

  @Test
  void shouldAggregatePullPushAndErrorMetricsIntoSnapshot() {
    var collector = new SyncMetricsCollector(new SimpleMeterRegistry());

    collector.recordPull(100, 3);
    collector.recordPull(300, 7);
    collector.recordPush(50, 2, 0);
    collector.recordPush(150, 5, 2);
    collector.recordError();

    var snapshot = collector.snapshot();

    assertEquals(2, snapshot.pullRequests());
    assertEquals(2, snapshot.pushRequests());
    assertEquals(200, snapshot.avgPullLatencyMs());
    assertEquals(100, snapshot.avgPushLatencyMs());
    assertEquals(10, snapshot.totalPullRows());
    assertEquals(2, snapshot.conflicts());
    assertEquals(1, snapshot.errors());
    assertEquals(5, snapshot.maxOutboxDepth());
  }
}