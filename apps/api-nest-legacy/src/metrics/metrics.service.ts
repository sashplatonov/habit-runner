import { Injectable } from '@nestjs/common';

interface InternalMetrics {
  createdAt: string;
  pullRequests: number;
  pushRequests: number;
  totalPullLatencyMs: number;
  totalPushLatencyMs: number;
  totalPullRows: number;
  conflicts: number;
  errors: number;
  lastPullAt?: string;
  lastPushAt?: string;
  maxOutboxDepth: number;
}

@Injectable()
export class MetricsService {
  private readonly metrics: InternalMetrics = {
    createdAt: new Date().toISOString(),
    pullRequests: 0,
    pushRequests: 0,
    totalPullLatencyMs: 0,
    totalPushLatencyMs: 0,
    totalPullRows: 0,
    conflicts: 0,
    errors: 0,
    maxOutboxDepth: 0
  };

  recordPull(durationMs: number, rows: number) {
    this.metrics.pullRequests += 1;
    this.metrics.totalPullLatencyMs += durationMs;
    this.metrics.totalPullRows += rows;
    this.metrics.lastPullAt = new Date().toISOString();
  }

  recordPush(durationMs: number, conflicts: number, outboxDepth: number) {
    this.metrics.pushRequests += 1;
    this.metrics.totalPushLatencyMs += durationMs;
    this.metrics.conflicts += conflicts;
    this.metrics.lastPushAt = new Date().toISOString();
    this.metrics.maxOutboxDepth = Math.max(this.metrics.maxOutboxDepth, outboxDepth);
  }

  recordError() {
    this.metrics.errors += 1;
  }

  snapshot() {
    return {
      createdAt: this.metrics.createdAt,
      pullRequests: this.metrics.pullRequests,
      pushRequests: this.metrics.pushRequests,
      avgPullLatencyMs:
        this.metrics.pullRequests === 0
          ? 0
          : Math.round(this.metrics.totalPullLatencyMs / this.metrics.pullRequests),
      avgPushLatencyMs:
        this.metrics.pushRequests === 0
          ? 0
          : Math.round(this.metrics.totalPushLatencyMs / this.metrics.pushRequests),
      totalPullRows: this.metrics.totalPullRows,
      conflicts: this.metrics.conflicts,
      errors: this.metrics.errors,
      lastPullAt: this.metrics.lastPullAt,
      lastPushAt: this.metrics.lastPushAt,
      maxOutboxDepth: this.metrics.maxOutboxDepth
    };
  }
}
