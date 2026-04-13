package com.sashplatonov.habbit.runner.auth;

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
    rt.userId = userId;
    rt.token = UUID.randomUUID().toString();
    rt.revoked = revoked;
    rt.setExpiry(expiresAt);
    ut.begin();
    rt.persist();
    ut.commit();
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
