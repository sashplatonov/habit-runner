package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.dto.UpdateThemeRequest;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.support.AuthenticatedApiTestSupport;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@QuarkusTest
class AuthThemeResourceTest extends AuthenticatedApiTestSupport {

  private String userId;
  private String token;

  @BeforeEach
  void setUp() throws Exception {
    var user = createAuthenticatedUser("cloud");
    userId = user.id();
    token = user.accessToken();
  }

  @Test
  void shouldReturnCurrentThemeWhenAuthorizedUserRequestsTheme() {
    given()
        .header("Authorization", "Bearer " + token)
        .when()
        .get("/auth/theme")
        .then()
        .statusCode(200)
        .body("theme", equalTo("cloud"));
  }

  @Test
  void shouldUpdateThemeWhenAuthorizedUserSubmitsSupportedTheme() {
    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(new UpdateThemeRequest("matrix"))
        .when()
        .put("/auth/theme")
        .then()
        .statusCode(200)
        .body("theme", equalTo("matrix"));

    assertStoredTheme("matrix");
  }

  @ParameterizedTest
  @ValueSource(strings = {"graphite", "aurora", "dune", "lagoon"})
  void shouldRoundTripNewThemeIds(String themeId) {
    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(new UpdateThemeRequest(themeId))
        .when()
        .put("/auth/theme")
        .then()
        .statusCode(200)
        .body("theme", equalTo(themeId));

    assertStoredTheme(themeId);
  }

  @Test
  void shouldNormalizeThemeToCloudWhenUnsupportedThemeSubmitted() {
    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(new UpdateThemeRequest("unsupported-theme"))
        .when()
        .put("/auth/theme")
        .then()
        .statusCode(200)
        .body("theme", equalTo("cloud"));

    assertStoredTheme("cloud");
  }

  @Test
  void shouldReturn400WhenBlankThemeSubmitted() {
    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body("{\"theme\": \"\"}")
        .when()
        .put("/auth/theme")
        .then()
        .statusCode(400)
        .body("title", equalTo("Constraint Violation"))
          .body("detail", containsString("must not be blank"));
  }

  @Test
  void shouldReturn401WhenThemeRequestedWithoutAccessToken() {
    given()
        .when()
        .get("/auth/theme")
        .then()
          .statusCode(403)
          .body("status", equalTo(403))
          .body("detail", equalTo("Authentication required"))
          .body("errorCode", equalTo("AUTH_REQUIRED"));
  }

  @Test
  void shouldReturn401WhenThemeUpdatedWithoutAccessToken() {
    given()
        .contentType(ContentType.JSON)
        .body(new UpdateThemeRequest("matrix"))
        .when()
        .put("/auth/theme")
        .then()
          .statusCode(403)
          .body("status", equalTo(403))
          .body("detail", equalTo("Authentication required"))
          .body("errorCode", equalTo("AUTH_REQUIRED"));
  }

  private void assertStoredTheme(String expectedTheme) {
    var user = UserEntity.<UserEntity>findById(userId);
    assertNotNull(user);
    assertEquals(expectedTheme, user.getTheme());
  }
}
