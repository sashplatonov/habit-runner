package com.sashplatonov.habbit.runner.auth.support;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class AuthResourceSupport {
  private final AuthCookieBuilder authCookieBuilder;
  private final AuthRateLimitService authRateLimitService;

  public AuthResourceSupport(
      AuthCookieBuilder authCookieBuilder,
      AuthRateLimitService authRateLimitService
  ) {
    this.authCookieBuilder = authCookieBuilder;
    this.authRateLimitService = authRateLimitService;
  }

  public AuthCookieBuilder cookieBuilder() {
    return authCookieBuilder;
  }

  public AuthRateLimitService rateLimitService() {
    return authRateLimitService;
  }
}
