package com.sashplatonov.habbit.runner.auth.support;

import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.core.NewCookie;

import java.net.URI;

@ApplicationScoped
public class AuthCookieBuilder {
  public static final String ACCESS_TOKEN_COOKIE = "habbit_runner_access_token";
  public static final String REFRESH_TOKEN_COOKIE = "habbit_runner_refresh_token";
  public static final String CSRF_TOKEN_COOKIE = "habbit_runner_csrf_token";

  private final AuthConfig authConfig;

  public AuthCookieBuilder(AuthConfig authConfig) {
    this.authConfig = authConfig;
  }

  public NewCookie accessToken(String token, int ttlSeconds) {
    return cookie(ACCESS_TOKEN_COOKIE, token, ttlSeconds, true);
  }

  public NewCookie refreshToken(String token, int ttlSeconds) {
    return cookie(REFRESH_TOKEN_COOKIE, token, ttlSeconds, true);
  }

  public NewCookie csrfToken(String token, int ttlSeconds) {
    return cookie(CSRF_TOKEN_COOKIE, token, ttlSeconds, false);
  }

  public NewCookie expiredAccessToken() {
    return cookie(ACCESS_TOKEN_COOKIE, "", 0, true);
  }

  public NewCookie expiredRefreshToken() {
    return cookie(REFRESH_TOKEN_COOKIE, "", 0, true);
  }

  public NewCookie expiredCsrfToken() {
    return cookie(CSRF_TOKEN_COOKIE, "", 0, false);
  }

  private NewCookie cookie(String name, String value, int maxAge, boolean httpOnly) {
    return new NewCookie.Builder(name)
        .value(value)
        .path("/")
        .maxAge(maxAge)
        .httpOnly(httpOnly)
        .secure(isSecure())
        .sameSite(NewCookie.SameSite.STRICT)
        .build();
  }

  private boolean isSecure() {
    return URI.create(authConfig.apiPublicUrl()).getScheme().equalsIgnoreCase("https");
  }
}
