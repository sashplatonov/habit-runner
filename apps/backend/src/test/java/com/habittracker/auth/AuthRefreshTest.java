package com.habittracker.auth;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.habittracker.auth.dto.RefreshRequest;
import com.habittracker.model.RefreshTokenEntity;
import com.habittracker.model.UserEntity;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.transaction.UserTransaction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class AuthRefreshTest {

  private static final String TEST_SECRET = "test-secret-for-unit-tests-1234567890";
  private static final String TEST_ISSUER = "habittracker-test";

  @Inject
  UserTransaction ut;

  private String userId;

  @BeforeEach
  void setUp() throws Exception {
    userId = UUID.randomUUID().toString();
    ut.begin();
    var user = new UserEntity();
    user.id = userId;
    user.email = userId + "@test.com";
    user.theme = "cloud";
    user.persist();
    ut.commit();
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
  void refreshWithValidTokenReturnsNewAccessToken() throws Exception {
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
  void refreshWithExpiredTokenReturns401() throws Exception {
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
  void refreshWithRevokedTokenReturns401() throws Exception {
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
  void refreshWithUnknownTokenReturns401() {
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
    void refreshWithBlankTokenReturns400() {
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

    @Test
    void getThemeReturnsTypedThemeResponse() {
      var accessToken = generateAccessToken(userId, userId + "@test.com");

      given()
      .header("Authorization", "Bearer " + accessToken)
      .when()
      .get("/auth/theme")
      .then()
      .statusCode(200)
      .body("theme", equalTo("cloud"));
    }

  // ─── Logout (revoke) test ─────────────────────────────────────────────────

  @Test
  void logoutRevokesRefreshToken() throws Exception {
    var accessToken = generateAccessToken(userId, userId + "@test.com");
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

  private String generateAccessToken(String sub, String email) {
    var now = Instant.now();
    return JWT.create()
        .withSubject(sub)
        .withClaim("email", email)
        .withIssuer(TEST_ISSUER)
        .withIssuedAt(Date.from(now))
        .withExpiresAt(Date.from(now.plus(3600, ChronoUnit.SECONDS)))
        .sign(Algorithm.HMAC256(TEST_SECRET));
  }
}
