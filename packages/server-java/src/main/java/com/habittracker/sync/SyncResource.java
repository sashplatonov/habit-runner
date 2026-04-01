package com.habittracker.sync;

import com.habittracker.auth.CurrentUserContext;
import com.habittracker.auth.RequireAuth;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.UUID;

@Path("/sync")
@Produces(MediaType.APPLICATION_JSON)
@RequireAuth
public class SyncResource {
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
    var payload = syncService.pull(userId, since);
    return Response.ok(payload)
        .header("x-trace-id", traceId)
        .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, proxy-revalidate")
        .header("Pragma", "no-cache")
        .header("Expires", "0")
        .build();
  }

  @POST
  @Path("/push")
  public Response push(SyncDtos.PushRequestDto body) {
    var userId = currentUserContext.requireUser().id();
    var traceId = traceId();
    var ops = body == null || body.ops() == null ? java.util.List.<SyncDtos.SyncOpDto>of() : body.ops();
    var payload = syncService.push(userId, ops);
    return Response.ok(payload)
        .header("x-trace-id", traceId)
        .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, proxy-revalidate")
        .header("Pragma", "no-cache")
        .header("Expires", "0")
        .build();
  }

  private String traceId() {
    var trace = requestContext.getHeaderString("x-trace-id");
    if (trace == null || trace.isBlank()) {
      return UUID.randomUUID().toString();
    }
    return trace.trim();
  }
}
