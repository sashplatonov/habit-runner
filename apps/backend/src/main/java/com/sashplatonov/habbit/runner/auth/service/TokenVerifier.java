package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.JwtUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotAuthorizedException;

@ApplicationScoped
public class TokenVerifier {
  private final JwtUtil jwtUtil;

  @Inject
  public TokenVerifier(JwtUtil jwtUtil) {
    this.jwtUtil = jwtUtil;
  }

  public CurrentUser verify(String token) {
    try {
      return jwtUtil.verify(token);
    } catch (IllegalArgumentException ex) {
      throw new NotAuthorizedException("Invalid token", ex);
    }
  }
}
