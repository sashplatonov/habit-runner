package com.sashplatonov.habbit.runner.api;

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
}
