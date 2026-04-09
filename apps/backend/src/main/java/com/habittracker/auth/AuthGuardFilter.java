package com.habittracker.auth;

import jakarta.annotation.Priority;
import jakarta.enterprise.context.RequestScoped;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;

@Provider
@RequestScoped
@RequireAuth
@Priority(Priorities.AUTHENTICATION)
public class AuthGuardFilter implements ContainerRequestFilter {
  final AuthService authService;
  final CurrentUserContext currentUserContext;

  public AuthGuardFilter(AuthService authService, CurrentUserContext currentUserContext) {
    this.authService = authService;
    this.currentUserContext = currentUserContext;
  }

  @Override
  public void filter(ContainerRequestContext requestContext) {
    var authorization = requestContext.getHeaderString("Authorization");
    var token = BearerTokenExtractor.extract(authorization);
    if (token == null) {
      throw new NotAuthorizedException("Authentication required");
    }

    var user = authService.verifyAccessToken(token);
    currentUserContext.setUser(user);
  }
}
