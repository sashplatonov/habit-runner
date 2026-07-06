package com.sashplatonov.habbit.runner.api;

import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.core.MultivaluedMap;

final class ResponseHeaders {
  private final ContainerResponseContext responseContext;

  ResponseHeaders(ContainerResponseContext responseContext) {
    this.responseContext = responseContext;
  }

  void putIfMissing(String name, String value) {
    if (headers().getFirst(name) == null) {
      headers().putSingle(name, value);
    }
  }

  void putSingle(String name, String value) {
    headers().putSingle(name, value);
  }

  private MultivaluedMap<String, Object> headers() {
    return responseContext.getHeaders();
  }
}
