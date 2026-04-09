package com.habittracker.auth;

import com.habittracker.auth.dto.RefreshRequest;
import com.habittracker.model.RefreshTokenEntity;
import com.habittracker.support.AuthenticatedApiTestSupport;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
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
  private String accessToken;

  @BeforeEach
  void setUp() throws Exception {
    var user = createAuthenticatedUser("cloud");
    userId = user.id();
    accessToken = user.accessToken();
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

    given()
        .contentType(ContentType.JSON)
        .body(new RefreshRequest(refreshToken))
        .when()
        .post("/auth/refresh")
        .then()
        .statusCode(200)
        .body("accessToken", notNullValue())
        .body("refreshToken", equalTo(refreshToken))
        .body("tokenType", equalTo("Bearer"))
        .body("expiresIn", greaterThan(0));
  }

  @Test
  void shouldReturn401WhenRefreshTokenIsExpired() throws Exception {
    var expiredToken = insertRefreshToken(false, Instant.now().minus(1, ChronoUnit.DAYS));

    given()
        .contentType(ContentType.JSON)
        .body(new RefreshRequest(expiredToken))
        .when()
        .post("/auth/refresh")
        .then()
        .statusCode(401);
  }

  @Test
  void shouldReturn401WhenRefreshTokenIsRevoked() throws Exception {
    var revokedToken = insertRefreshToken(true, Instant.now().plus(30, ChronoUnit.DAYS));

    given()
        .contentType(ContentType.JSON)
        .body(new RefreshRequest(revokedToken))
        .when()
        .post("/auth/refresh")
        .then()
        .statusCode(401);
  }

  @Test
  void shouldReturn401WhenRefreshTokenIsUnknown() {
    given()
        .contentType(ContentType.JSON)
        .body(new RefreshRequest("not-a-real-token"))
        .when()
        .post("/auth/refresh")
        .then()
        .statusCode(401)
        .body("status", equalTo(401))
        .body("message", equalTo("Unauthorized"))
        .body("timestamp", notNullValue());
  }

  @Test
  void shouldReturn400WhenRefreshTokenIsBlank() {
    given()
        .contentType(ContentType.JSON)
        .body("{\"refreshToken\": \"\"}")
        .when()
        .post("/auth/refresh")
        .then()
        .statusCode(400)
        .body("status", equalTo(400))
        .body("title", equalTo("Constraint Violation"))
        .body("violations.message", hasItem("must not be blank"));
  }

  // ─── Logout (revoke) test ─────────────────────────────────────────────────

  @Test
  void shouldRevokeRefreshTokenWhenLogoutRequested() throws Exception {
    var refreshToken = insertRefreshToken(false, Instant.now().plus(30, ChronoUnit.DAYS));

    given()
        .header("Authorization", "Bearer " + accessToken)
        .contentType(ContentType.JSON)
        .body(new RefreshRequest(refreshToken))
        .when()
        .post("/auth/logout")
        .then()
        .statusCode(204);

    // Attempting to use the revoked token should now fail
    given()
        .contentType(ContentType.JSON)
        .body(new RefreshRequest(refreshToken))
        .when()
        .post("/auth/refresh")
        .then()
        .statusCode(401);
  }
}
