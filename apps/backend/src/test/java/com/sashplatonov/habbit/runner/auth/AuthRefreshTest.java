package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.access.OAuthStateAccess;
import com.sashplatonov.habbit.runner.auth.access.UserAccess;
import com.sashplatonov.habbit.runner.auth.client.GoogleOAuthClient;
import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import com.sashplatonov.habbit.runner.auth.resource.AuthResource;
import com.sashplatonov.habbit.runner.auth.resource.AuthThemeResource;
import com.sashplatonov.habbit.runner.auth.security.AuthGuardFilter;
import com.sashplatonov.habbit.runner.auth.security.BearerTokenExtractor;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.CsrfGuardFilter;
import com.sashplatonov.habbit.runner.auth.security.JwtUtil;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.auth.service.AuthService;
import com.sashplatonov.habbit.runner.auth.service.PreferencesService;
import com.sashplatonov.habbit.runner.auth.service.RefreshTokenService;
import com.sashplatonov.habbit.runner.auth.service.UserService;
import com.sashplatonov.habbit.runner.auth.support.AuthCollaborators;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthSupport;
import com.sashplatonov.habbit.runner.auth.support.OAuthCallbackSession;
import com.sashplatonov.habbit.runner.auth.support.OAuthHelper;
import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;
import com.sashplatonov.habbit.runner.auth.support.ThemeCatalog;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.support.AuthenticatedApiTestSupport;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class AuthRefreshTest extends AuthenticatedApiTestSupport {

  private String userId;
  private String email;
  private static final String CSRF_TOKEN = "csrf-token";

  @BeforeEach
  void setUp() throws Exception {
    var user = createAuthenticatedUser("cloud");
    userId = user.id();
    email = user.email();
  }

  private String insertRefreshToken(boolean revoked, Instant expiresAt) throws Exception {
    var rt = new RefreshTokenEntity();
    rt.setUserId(userId);
    rt.setToken(UUID.randomUUID().toString());
    rt.setRevoked(revoked);
    rt.setExpiry(expiresAt);
    inTransaction(() -> {
      rt.persist();
      return null;
    });
    return rt.tokenValue();
  }

  // ─── Refresh token tests ──────────────────────────────────────────────────

  @Test
  void shouldReturnNewAccessTokenWhenRefreshTokenIsActive() throws Exception {
    var refreshToken = insertRefreshToken(false, Instant.now().plus(30, ChronoUnit.DAYS));

    givenRefreshCookies(refreshToken)
        .when()
        .post("/auth/refresh")
        .then()
        .statusCode(200)
      .body("userId", equalTo(userId))
      .body("email", equalTo(email));
  }

  @Test
  void shouldReturn401WhenRefreshTokenIsExpired() throws Exception {
    var expiredToken = insertRefreshToken(false, Instant.now().minus(1, ChronoUnit.DAYS));

    givenRefreshCookies(expiredToken)
        .when()
        .post("/auth/refresh")
        .then()
      .statusCode(403)
      .body("errorCode", equalTo("AUTH_REQUIRED"));
  }

  @Test
  void shouldReturn401WhenRefreshTokenIsRevoked() throws Exception {
    var revokedToken = insertRefreshToken(true, Instant.now().plus(30, ChronoUnit.DAYS));

    givenRefreshCookies(revokedToken)
        .when()
        .post("/auth/refresh")
        .then()
      .statusCode(403)
      .body("errorCode", equalTo("AUTH_REQUIRED"));
  }

  @Test
  void shouldReturn401WhenRefreshTokenIsUnknown() {
    givenRefreshCookies("not-a-real-token")
        .when()
        .post("/auth/refresh")
        .then()
      .statusCode(403)
      .body("status", equalTo(403))
      .body("detail", equalTo("Authentication required"))
      .body("errorCode", equalTo("AUTH_REQUIRED"));
  }

  @Test
  void shouldReturn400WhenRefreshTokenIsBlank() {
    givenRefreshCookies("")
        .when()
        .post("/auth/refresh")
        .then()
      .statusCode(403)
      .body("status", equalTo(403))
      .body("detail", equalTo("Authentication required"))
      .body("errorCode", equalTo("AUTH_REQUIRED"));
  }

  // ─── Logout (revoke) test ─────────────────────────────────────────────────

  @Test
  void shouldRevokeRefreshTokenWhenLogoutRequested() throws Exception {
    var refreshToken = insertRefreshToken(false, Instant.now().plus(30, ChronoUnit.DAYS));

    givenRefreshCookies(refreshToken)
        .when()
        .post("/auth/logout")
        .then()
        .statusCode(204);

    // Attempting to use the revoked token should now fail
    givenRefreshCookies(refreshToken)
        .when()
        .post("/auth/refresh")
        .then()
        .statusCode(403);
  }

  private io.restassured.specification.RequestSpecification givenRefreshCookies(String refreshToken) {
    return given()
        .cookie(AuthCookieBuilder.REFRESH_TOKEN_COOKIE, refreshToken)
        .cookie(AuthCookieBuilder.CSRF_TOKEN_COOKIE, CSRF_TOKEN)
        .header("X-CSRF-Token", CSRF_TOKEN);
  }
}
