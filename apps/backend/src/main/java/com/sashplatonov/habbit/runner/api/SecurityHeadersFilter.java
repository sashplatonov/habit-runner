package com.sashplatonov.habbit.runner.api;

import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import jakarta.ws.rs.core.MultivaluedMap;

@Provider
@Priority(Priorities.HEADER_DECORATOR)
public class SecurityHeadersFilter implements ContainerResponseFilter {

  @Override
  public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
    new ResponseHeaders(responseContext).applySecurityHeaders();
  }

  private static final class ResponseHeaders {
    private final ContainerResponseContext responseContext;

    private ResponseHeaders(ContainerResponseContext responseContext) {
      this.responseContext = responseContext;
    }

    private void applySecurityHeaders() {
      var headers = headers();
      headers.putSingle("X-Content-Type-Options", "nosniff");
      headers.putSingle("X-Frame-Options", "DENY");
      headers.putSingle("X-XSS-Protection", "0");
      headers.putSingle("Referrer-Policy", "no-referrer");
      headers.putSingle("Cross-Origin-Resource-Policy", "same-site");
      headers.putSingle("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    private MultivaluedMap<String, Object> headers() {
      return responseContext.getHeaders();
    }
  }
}
