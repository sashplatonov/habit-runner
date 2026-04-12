package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.api.ApiResponses;
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
import lombok.extern.slf4j.Slf4j;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/sync")
@Produces(MediaType.APPLICATION_JSON)
@RequireAuth
@Slf4j
@Tag(name = "Sync")
public class SyncResource {
  private static final long SLOW_SYNC_THRESHOLD_MS = 1_000L;

  final SyncService syncService;
  final CurrentUserContext currentUserContext;
  final SyncMetricsCollector syncMetricsCollector;

  @Context
  ContainerRequestContext requestContext;

  public SyncResource(SyncService syncService, CurrentUserContext currentUserContext, SyncMetricsCollector syncMetricsCollector) {
    this.syncService = syncService;
    this.currentUserContext = currentUserContext;
    this.syncMetricsCollector = syncMetricsCollector;
  }

  @GET
  @Path("/pull")
  @SuppressWarnings("PMD.AvoidCatchingGenericException")
  @Operation(summary = "Pull sync changes", description = "Returns habits, checkins, and tombstones changed after the optional cursor.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "Sync pull payload"),
      @APIResponse(responseCode = "403", description = "Authentication required",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response pull(@QueryParam("since") String since) {
    var userId = currentUserContext.requireUser().id();
    var traceId = traceId();
    var startedAt = System.nanoTime();
    try {
      var payload = syncService.pull(userId, since);
      var durationMs = durationMs(startedAt);
      var totalRows = payload.habits().size() + payload.checkins().size() + payload.tombstones().size();
      syncMetricsCollector.recordPull(durationMs, totalRows);
      log.debug(
          "event=sync_pull_completed, userId={}, traceId={}, habits={}, checkins={}, tombstones={}, durationMs={}",
          userId, traceId,
          payload.habits().size(), payload.checkins().size(), payload.tombstones().size(), durationMs
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
      return ApiResponses.noStore(payload, traceId, durationMs);
    } catch (RuntimeException ex) {
      syncMetricsCollector.recordError();
      throw ex;
    }
  }

  @POST
  @Path("/push")
  @SuppressWarnings("PMD.AvoidCatchingGenericException")
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
    var startedAt = System.nanoTime();
    var ops = body.ops();
    try {
      var payload = syncService.push(userId, ops);
      var durationMs = durationMs(startedAt);
      syncMetricsCollector.recordPush(durationMs, ops.size(), payload.conflicts().size());
      if (!payload.conflicts().isEmpty()) {
        log.warn(
            "event=sync_push_conflicts, userId={}, traceId={}, opCount={}, appliedCount={}, conflictCount={}, durationMs={}",
            userId,
            traceId,
            ops.size(),
            payload.applied().size(),
            payload.conflicts().size(),
            durationMs
        );
      } else if (durationMs > SLOW_SYNC_THRESHOLD_MS) {
        log.warn(
            "event=sync_push_slow, userId={}, traceId={}, opCount={}, appliedCount={}, durationMs={}, thresholdMs={}",
            userId,
            traceId,
            ops.size(),
            payload.applied().size(),
            durationMs,
            SLOW_SYNC_THRESHOLD_MS
        );
      }
      return ApiResponses.noStore(payload, traceId, durationMs);
    } catch (RuntimeException ex) {
      syncMetricsCollector.recordError();
      throw ex;
    }
  }

  private String traceId() {
    return RequestTraceFilter.traceId(requestContext);
  }

  private long durationMs(long startedAt) {
    return Math.round((System.nanoTime() - startedAt) / 1_000_000.0d);
  }
}
