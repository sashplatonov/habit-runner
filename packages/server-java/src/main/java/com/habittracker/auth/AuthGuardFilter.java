package com.habittracker.auth;

import jakarta.annotation.Priority;
import jakarta.enterprise.context.RequestScoped;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.ext.Provider;

@Provider
@RequestScoped
@Priority(Priorities.AUTHENTICATION)
public class AuthGuardFilter implements ContainerRequestFilter {
  @Context
  jakarta.ws.rs.container.ResourceInfo resourceInfo;

  final AuthService authService;
  final CurrentUserContext currentUserContext;

  public AuthGuardFilter(AuthService authService, CurrentUserContext currentUserContext) {
    this.authService = authService;
    this.currentUserContext = currentUserContext;
  }

  @Override
  public void filter(ContainerRequestContext requestContext) {
    var method = resourceInfo.getResourceMethod();
    var requiresAuth = method != null && method.isAnnotationPresent(RequireAuth.class);
    if (!requiresAuth) {
      return;
    }

    var authorization = requestContext.getHeaderString("Authorization");
    var token = extractToken(authorization);
    if (token == null) {
      throw new NotAuthorizedException("Authentication required");
    }

    var user = authService.verifyAccessToken(token);
    currentUserContext.setUser(user);
  }

  private String extractToken(String header) {
    if (header == null || header.isBlank()) {
      return null;
    }
    var parts = header.split(" ", 2);
    if (parts.length != 2 || !"bearer".equalsIgnoreCase(parts[0])) {
      return null;
    }
    return parts[1].trim();
  }
}
