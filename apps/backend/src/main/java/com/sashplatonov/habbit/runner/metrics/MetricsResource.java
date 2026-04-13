package com.sashplatonov.habbit.runner.metrics;

import com.sashplatonov.habbit.runner.api.ErrorResponse;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/metrics")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Metrics")
public class MetricsResource {
  final SyncMetricsCollector syncMetricsCollector;

  public MetricsResource(SyncMetricsCollector syncMetricsCollector) {
    this.syncMetricsCollector = syncMetricsCollector;
  }

  @GET
  @Operation(summary = "Get sync metrics snapshot", description = "Returns the current in-process sync metrics snapshot.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "Metrics snapshot",
          content = @Content(schema = @Schema(implementation = MetricsSnapshotDto.class))),
      @APIResponse(responseCode = "500", description = "Metrics unavailable",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response getMetrics() {
    return Response.ok(syncMetricsCollector.snapshot()).build();
  }
}
