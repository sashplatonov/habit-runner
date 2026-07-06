package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.api.RequestTraceFilter;
import com.sashplatonov.habbit.runner.auth.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.RequireAuth;
import com.sashplatonov.habbit.runner.metrics.SyncMetricsCollector;
import com.sashplatonov.habbit.runner.sync.dto.PushRequestDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/sync")
@Produces(MediaType.APPLICATION_JSON)
@RequireAuth
@Tag(name = "Sync")
public class SyncResource {
  final SyncService syncService;
  final CurrentUserContext currentUserContext;
  final SyncMetricsCollector syncMetricsCollector;

  @Context
  ContainerRequestContext requestContext;

  public SyncResource(
      SyncService syncService,
      CurrentUserContext currentUserContext,
      SyncMetricsCollector syncMetricsCollector
  ) {
    this.syncService = syncService;
    this.currentUserContext = currentUserContext;
    this.syncMetricsCollector = syncMetricsCollector;
  }

  @GET
  @Path("/pull")
  @Operation(summary = "Pull sync changes", description = "Returns habits, checkins, and tombstones changed after the optional cursor.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "Sync pull payload"),
      @APIResponse(responseCode = "403", description = "Authentication required",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response pull(@QueryParam("since") String since) {
    var userId = currentUserContext.requireUser().id();
    var traceId = traceId();
    try (var tracker = SyncRequestTracker.pull(syncMetricsCollector, userId, traceId)) {
      var payload = syncService.pull(userId, since);
      return tracker.completePull(payload);
    }
  }

  @POST
  @Path("/push")
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Push sync changes", description = "Applies habit and checkin mutations for the authenticated user.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "Sync push result"),
      @APIResponse(responseCode = "400", description = "Validation failed",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
      @APIResponse(responseCode = "403", description = "Authentication required",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response push(@Valid @NotNull PushRequestDto body) {
    var userId = currentUserContext.requireUser().id();
    var traceId = traceId();
    var ops = body.ops();
    try (var tracker = SyncRequestTracker.push(syncMetricsCollector, userId, traceId, ops.size())) {
      var payload = syncService.push(userId, ops);
      return tracker.completePush(payload);
    }
  }

  private String traceId() {
    return RequestTraceFilter.traceId(requestContext);
  }
}
