package com.habittracker.sync;

import com.habittracker.api.ApiResponses;
import com.habittracker.api.RequestTraceFilter;
import com.habittracker.auth.CurrentUserContext;
import com.habittracker.auth.RequireAuth;
import com.habittracker.metrics.SyncMetricsCollector;
import com.habittracker.sync.dto.PushRequestDto;
import com.habittracker.sync.dto.SyncOpDto;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Path("/sync")
@Produces(MediaType.APPLICATION_JSON)
@RequireAuth
@Slf4j
public class SyncResource {
  private static final long SLOW_SYNC_THRESHOLD_MS = 1_000L;
  private static final int MAX_PUSH_OPS = 500;

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
  public Response push(PushRequestDto body) {
    var userId = currentUserContext.requireUser().id();
    var traceId = traceId();
    var startedAt = System.nanoTime();
    var ops = body == null || body.ops() == null ? List.<SyncOpDto>of() : body.ops();
    guardPushOpsCount(ops);
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

  private void guardPushOpsCount(List<SyncOpDto> ops) {
    if (ops.size() > MAX_PUSH_OPS) {
      throw new WebApplicationException(
          "Push payload exceeds maximum op count of " + MAX_PUSH_OPS,
          Response.status(422).build()
      );
    }
  }
}
