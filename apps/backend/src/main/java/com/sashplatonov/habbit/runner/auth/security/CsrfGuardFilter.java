package com.sashplatonov.habbit.runner.auth.security;

import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.RequestScoped;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Cookie;
import jakarta.ws.rs.ext.Provider;

@Provider
@RequestScoped
@Priority(Priorities.AUTHENTICATION + 1)
public class CsrfGuardFilter implements ContainerRequestFilter {
  private static final String CSRF_HEADER = "X-CSRF-Token";

  @Override
  public void filter(ContainerRequestContext requestContext) {
    if (!isMutatingMethod(requestContext.getMethod())) {
      return;
    }
    if (!requiresCsrf(requestContext)) {
      return;
    }
    var csrfCookie = cookieValue(requestContext, AuthCookieBuilder.CSRF_TOKEN_COOKIE);
    var csrfHeader = requestContext.getHeaderString(CSRF_HEADER);
    if (csrfCookie == null || csrfHeader == null || !csrfCookie.equals(csrfHeader)) {
      throw new ForbiddenException("Invalid CSRF token");
    }
  }

  private boolean isMutatingMethod(String method) {
    return "POST".equalsIgnoreCase(method)
        || "PUT".equalsIgnoreCase(method)
        || "DELETE".equalsIgnoreCase(method)
        || "PATCH".equalsIgnoreCase(method);
  }

  private boolean requiresCsrf(ContainerRequestContext requestContext) {
    return cookieValue(requestContext, AuthCookieBuilder.ACCESS_TOKEN_COOKIE) != null
        || cookieValue(requestContext, AuthCookieBuilder.REFRESH_TOKEN_COOKIE) != null;
  }

  private String cookieValue(ContainerRequestContext requestContext, String name) {
    var cookies = requestContext.getCookies();
    if (cookies == null) {
      return null;
    }
    Cookie cookie = cookies.get(name);
    return cookie == null || cookie.getValue() == null || cookie.getValue().isBlank()
        ? null
        : cookie.getValue();
  }
}
