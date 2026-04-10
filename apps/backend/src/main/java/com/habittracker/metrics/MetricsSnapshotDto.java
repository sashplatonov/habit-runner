package com.habittracker.metrics;

public record MetricsSnapshotDto(
    String createdAt,
    int pullRequests,
    int pushRequests,
    int avgPullLatencyMs,
    int avgPushLatencyMs,
    int totalPullRows,
    int conflicts,
    int errors,
    int maxOutboxDepth
) {
}
