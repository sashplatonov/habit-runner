package com.habittracker.sync;

import com.habittracker.api.ApiResponses;
import com.habittracker.api.RequestTraceFilter;
import com.habittracker.auth.CurrentUserContext;
import com.habittracker.auth.RequireAuth;
import com.habittracker.sync.dto.PushRequestDto;
import com.habittracker.sync.dto.SyncOpDto;
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

@Path("/sync")
@Produces(MediaType.APPLICATION_JSON)
@RequireAuth
@Slf4j
public class SyncResource {
  private static final long SLOW_SYNC_THRESHOLD_MS = 1_000L;

  final SyncService syncService;
  final CurrentUserContext currentUserContext;

  @Context
  ContainerRequestContext requestContext;

  public SyncResource(SyncService syncService, CurrentUserContext currentUserContext) {
    this.syncService = syncService;
    this.currentUserContext = currentUserContext;
  }

  @GET
  @Path("/pull")
  public Response pull(@QueryParam("since") String since) {
    var userId = currentUserContext.requireUser().id();
    var traceId = traceId();
    var startedAt = System.nanoTime();
    var payload = syncService.pull(userId, since);
    var durationMs = durationMs(startedAt);
    if (durationMs > SLOW_SYNC_THRESHOLD_MS) {
      log.warn(
          "Slow sync pull detected: userId={}, traceId={}, habits={}, checkins={}, tombstones={}, durationMs={}, thresholdMs={}",
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
  }

  @POST
  @Path("/push")
  public Response push(PushRequestDto body) {
    var userId = currentUserContext.requireUser().id();
    var traceId = traceId();
    var startedAt = System.nanoTime();
    var ops = body == null || body.ops() == null ? java.util.List.<SyncOpDto>of() : body.ops();
    var payload = syncService.push(userId, ops);
    var durationMs = durationMs(startedAt);
    if (!payload.conflicts().isEmpty()) {
      log.warn(
          "Sync push completed with conflicts: userId={}, traceId={}, opCount={}, appliedCount={}, conflictCount={}, durationMs={}",
          userId,
          traceId,
          ops.size(),
          payload.applied().size(),
          payload.conflicts().size(),
          durationMs
      );
    } else if (durationMs > SLOW_SYNC_THRESHOLD_MS) {
      log.warn(
          "Slow sync push detected: userId={}, traceId={}, opCount={}, appliedCount={}, durationMs={}, thresholdMs={}",
          userId,
          traceId,
          ops.size(),
          payload.applied().size(),
          durationMs,
          SLOW_SYNC_THRESHOLD_MS
      );
    }
    return ApiResponses.noStore(payload, traceId, durationMs);
  }

  private String traceId() {
    return RequestTraceFilter.traceId(requestContext);
  }

  private long durationMs(long startedAt) {
    return Math.round((System.nanoTime() - startedAt) / 1_000_000.0d);
  }
}
