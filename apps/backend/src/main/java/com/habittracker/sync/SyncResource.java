package com.habittracker.sync;

import com.habittracker.api.ApiResponses;
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
import org.jboss.logging.Logger;

import java.util.UUID;

@Path("/sync")
@Produces(MediaType.APPLICATION_JSON)
@RequireAuth
public class SyncResource {
  private static final Logger LOG = Logger.getLogger(SyncResource.class);

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
    LOG.debugf("Completed sync pull: userId=%s traceId=%s durationMs=%d", userId, traceId, durationMs);
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
    LOG.debugf(
        "Completed sync push: userId=%s traceId=%s opCount=%d durationMs=%d",
        userId,
        traceId,
        ops.size(),
        durationMs
    );
    return ApiResponses.noStore(payload, traceId, durationMs);
  }

  private String traceId() {
    var trace = requestContext.getHeaderString("x-trace-id");
    if (trace == null || trace.isBlank()) {
      return UUID.randomUUID().toString();
    }
    return trace.trim();
  }

  private long durationMs(long startedAt) {
    return Math.round((System.nanoTime() - startedAt) / 1_000_000.0d);
  }
}
