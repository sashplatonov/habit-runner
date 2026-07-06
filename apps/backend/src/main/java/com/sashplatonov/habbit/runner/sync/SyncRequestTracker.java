package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.api.ApiResponses;
import com.sashplatonov.habbit.runner.metrics.SyncMetricsCollector;
import com.sashplatonov.habbit.runner.sync.dto.PullResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.PushResponseDto;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;

@Slf4j
final class SyncRequestTracker implements AutoCloseable {
  private static final long SLOW_SYNC_THRESHOLD_MS = 1_000L;

  private final SyncMetricsCollector metrics;
  private final String userId;
  private final String traceId;
  private final int operationCount;
  private final long startedAt;
  private boolean completed;

  private SyncRequestTracker(
      SyncMetricsCollector metrics,
      String userId,
      String traceId,
      int operationCount
  ) {
    this.metrics = metrics;
    this.userId = userId;
    this.traceId = traceId;
    this.operationCount = operationCount;
    this.startedAt = System.nanoTime();
  }

  static SyncRequestTracker pull(SyncMetricsCollector metrics, String userId, String traceId) {
    return new SyncRequestTracker(metrics, userId, traceId, 0);
  }

  static SyncRequestTracker push(
      SyncMetricsCollector metrics,
      String userId,
      String traceId,
      int operationCount
  ) {
    return new SyncRequestTracker(metrics, userId, traceId, operationCount);
  }

  Response completePull(PullResponseDto payload) {
    var durationMs = durationMs();
    var totalRows = payload.habits().size() + payload.checkins().size() + payload.tombstones().size();
    metrics.recordPull(durationMs, totalRows);
    log.debug(
        "event=sync_pull_completed, userId={}, traceId={}, habits={}, checkins={}, tombstones={}, durationMs={}",
        userId,
        traceId,
        payload.habits().size(),
        payload.checkins().size(),
        payload.tombstones().size(),
        durationMs
    );
    if (durationMs > SLOW_SYNC_THRESHOLD_MS) {
      log.warn(
          "event=sync_pull_slow, userId={}, traceId={}, habits={}, checkins={}, tombstones={}, durationMs={}, thresholdMs={}",
          userId,
          traceId,
          payload.habits().size(),
          payload.checkins().size(),
          payload.tombstones().size(),
          durationMs,
          SLOW_SYNC_THRESHOLD_MS
      );
    }
    completed = true;
    return ApiResponses.noStore(payload, traceId, durationMs);
  }

  Response completePush(PushResponseDto payload) {
    var durationMs = durationMs();
    metrics.recordPush(durationMs, operationCount, payload.conflicts().size());
    if (!payload.conflicts().isEmpty()) {
      log.warn(
          "event=sync_push_conflicts, userId={}, traceId={}, opCount={}, appliedCount={}, conflictCount={}, durationMs={}",
          userId,
          traceId,
          operationCount,
          payload.applied().size(),
          payload.conflicts().size(),
          durationMs
      );
    } else if (durationMs > SLOW_SYNC_THRESHOLD_MS) {
      log.warn(
          "event=sync_push_slow, userId={}, traceId={}, opCount={}, appliedCount={}, durationMs={}, thresholdMs={}",
          userId,
          traceId,
          operationCount,
          payload.applied().size(),
          durationMs,
          SLOW_SYNC_THRESHOLD_MS
      );
    }
    completed = true;
    return ApiResponses.noStore(payload, traceId, durationMs);
  }

  @Override
  public void close() {
    if (!completed) {
      metrics.recordError();
    }
  }

  private long durationMs() {
    return Math.round((System.nanoTime() - startedAt) / 1_000_000.0d);
  }
}
