package com.habittracker.metrics;

import com.habittracker.api.ApiResponses;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/metrics")
@Produces(MediaType.APPLICATION_JSON)
public class MetricsResource {
  final SyncMetricsCollector syncMetricsCollector;
  final FrontendMetricsCollector frontendMetricsCollector;

  public MetricsResource(SyncMetricsCollector syncMetricsCollector, FrontendMetricsCollector frontendMetricsCollector) {
    this.syncMetricsCollector = syncMetricsCollector;
    this.frontendMetricsCollector = frontendMetricsCollector;
  }

  @GET
  public MetricsSnapshotDto getMetrics() {
    return syncMetricsCollector.snapshot();
  }

  @POST
  @Path("/frontend")
  @Consumes(MediaType.APPLICATION_JSON)
  public Response ingestFrontendMetric(FrontendMetricDto payload) {
    frontendMetricsCollector.record(payload);
    return ApiResponses.noContent();
  }
}
