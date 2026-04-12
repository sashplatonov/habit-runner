package com.sashplatonov.habbit.runner.metrics;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/metrics")
@Produces(MediaType.APPLICATION_JSON)
public class MetricsResource {
  final SyncMetricsCollector syncMetricsCollector;

  public MetricsResource(SyncMetricsCollector syncMetricsCollector) {
    this.syncMetricsCollector = syncMetricsCollector;
  }

  @GET
  public MetricsSnapshotDto getMetrics() {
    return syncMetricsCollector.snapshot();
  }
}
