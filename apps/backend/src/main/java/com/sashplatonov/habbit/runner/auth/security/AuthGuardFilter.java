package com.sashplatonov.habbit.runner.auth.security;

import com.sashplatonov.habbit.runner.auth.service.AuthService;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.RequestScoped;
import jakarta.ws.rs.core.Cookie;
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
    var token = accessToken(requestContext);
    if (token == null) {
      throw new NotAuthorizedException("Authentication required");
    }

    var user = authService.verifyAccessToken(token);
    currentUserContext.setUser(user);
  }

  private String accessToken(ContainerRequestContext requestContext) {
    var cookies = requestContext.getCookies();
    if (cookies != null) {
      Cookie cookie = cookies.get(AuthCookieBuilder.ACCESS_TOKEN_COOKIE);
      if (cookie != null && cookie.getValue() != null && !cookie.getValue().isBlank()) {
        return cookie.getValue();
      }
    }
    var authorization = requestContext.getHeaderString("Authorization");
    return BearerTokenExtractor.extract(authorization);
  }
}
