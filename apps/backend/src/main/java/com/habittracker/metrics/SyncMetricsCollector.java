package com.habittracker.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.LongAdder;

@ApplicationScoped
public class SyncMetricsCollector {
  private final Counter pullRequestsCounter;
  private final Counter pushRequestsCounter;
  private final Counter pullRowsCounter;
  private final Counter conflictsCounter;
  private final Counter errorsCounter;
  private final Timer pullLatencyTimer;
  private final Timer pushLatencyTimer;

  private final LongAdder pullRequests = new LongAdder();
  private final LongAdder pushRequests = new LongAdder();
  private final LongAdder pullLatencyTotalMs = new LongAdder();
  private final LongAdder pushLatencyTotalMs = new LongAdder();
  private final LongAdder totalPullRows = new LongAdder();
  private final LongAdder conflicts = new LongAdder();
  private final LongAdder errors = new LongAdder();
  private final AtomicLong maxOutboxDepth = new AtomicLong();

  public SyncMetricsCollector(MeterRegistry meterRegistry) {
    pullRequestsCounter = Counter.builder("habittracker_sync_pull_requests_total")
        .description("Total sync pull requests")
        .register(meterRegistry);
    pushRequestsCounter = Counter.builder("habittracker_sync_push_requests_total")
        .description("Total sync push requests")
        .register(meterRegistry);
    pullRowsCounter = Counter.builder("habittracker_sync_pull_rows_total")
        .description("Total rows returned by sync pull")
        .register(meterRegistry);
    conflictsCounter = Counter.builder("habittracker_sync_conflicts_total")
        .description("Total sync conflicts returned to clients")
        .register(meterRegistry);
    errorsCounter = Counter.builder("habittracker_sync_errors_total")
        .description("Total sync request failures")
        .register(meterRegistry);
    pullLatencyTimer = Timer.builder("habittracker_sync_pull_latency")
        .description("Sync pull latency")
        .publishPercentileHistogram()
        .register(meterRegistry);
    pushLatencyTimer = Timer.builder("habittracker_sync_push_latency")
        .description("Sync push latency")
        .publishPercentileHistogram()
        .register(meterRegistry);

    Gauge.builder("habittracker_sync_max_outbox_depth", maxOutboxDepth, AtomicLong::get)
        .description("Largest push operation batch received")
        .register(meterRegistry);
  }

  public void recordPull(long durationMs, int rows) {
    var safeDurationMs = Math.max(durationMs, 0L);
    var safeRows = Math.max(rows, 0);

    pullRequests.increment();
    pullLatencyTotalMs.add(safeDurationMs);
    totalPullRows.add(safeRows);

    pullRequestsCounter.increment();
    pullRowsCounter.increment(safeRows);
    pullLatencyTimer.record(Duration.ofMillis(safeDurationMs));
  }

  public void recordPush(long durationMs, int operationCount, int conflictCount) {
    var safeDurationMs = Math.max(durationMs, 0L);
    var safeOperationCount = Math.max(operationCount, 0);
    var safeConflictCount = Math.max(conflictCount, 0);

    pushRequests.increment();
    pushLatencyTotalMs.add(safeDurationMs);
    updateMaxOutboxDepth(safeOperationCount);

    pushRequestsCounter.increment();
    pushLatencyTimer.record(Duration.ofMillis(safeDurationMs));

    if (safeConflictCount > 0) {
      conflicts.add(safeConflictCount);
      conflictsCounter.increment(safeConflictCount);
    }
  }

  public void recordError() {
    errors.increment();
    errorsCounter.increment();
  }

  public MetricsSnapshotDto snapshot() {
    return new MetricsSnapshotDto(
        Instant.now().toString(),
        toIntSaturated(pullRequests.longValue()),
        toIntSaturated(pushRequests.longValue()),
        averageMs(pullLatencyTotalMs.longValue(), pullRequests.longValue()),
        averageMs(pushLatencyTotalMs.longValue(), pushRequests.longValue()),
        toIntSaturated(totalPullRows.longValue()),
        toIntSaturated(conflicts.longValue()),
        toIntSaturated(errors.longValue()),
        toIntSaturated(maxOutboxDepth.get())
    );
  }

  private void updateMaxOutboxDepth(int operationCount) {
    maxOutboxDepth.accumulateAndGet(operationCount, Math::max);
  }

  private int averageMs(long totalDurationMs, long count) {
    if (count <= 0) {
      return 0;
    }
    return toIntSaturated(Math.round(totalDurationMs / (double) count));
  }

  private int toIntSaturated(long value) {
    if (value <= 0L) {
      return 0;
    }
    return value > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) value;
  }
}