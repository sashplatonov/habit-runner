package com.sashplatonov.habbit.runner.api;

import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;

import java.net.URI;

public final class ApiResponses {
  private ApiResponses() {
  }

  public static Response redirect(String location) {
    return Response.status(Response.Status.FOUND).location(URI.create(location)).build();
  }

  public static <T> Response created(T payload) {
    return Response.status(Response.Status.CREATED).entity(payload).build();
  }

  public static Response noContent() {
    return Response.noContent().build();
  }

  public static <T> Response noStore(T payload, String traceId, long durationMs) {
    return Response.ok(payload)
        .header("x-trace-id", traceId)
        .header("x-sync-duration-ms", durationMs)
        .header("Server-Timing", "app;dur=" + durationMs)
        .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, proxy-revalidate")
        .header("Pragma", "no-cache")
        .header("Expires", "0")
        .build();
  }
}