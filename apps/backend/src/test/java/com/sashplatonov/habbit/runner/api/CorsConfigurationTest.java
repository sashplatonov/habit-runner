package com.sashplatonov.habbit.runner.api;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.response.Response;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

@QuarkusTest
class CorsConfigurationTest {
  private static final String ALLOWED_ORIGIN = "http://localhost:5173";
  private static final String UNALLOWED_ORIGIN = "https://untrusted.example";

  @Test
  void shouldAllowCsrfHeaderForConfiguredOriginPreflight() {
    given()
        .header("Origin", ALLOWED_ORIGIN)
        .header("Access-Control-Request-Method", "POST")
        .header("Access-Control-Request-Headers", "X-CSRF-Token")
        .when()
        .options("/auth/refresh")
        .then()
        .statusCode(200)
        .header("Access-Control-Allow-Origin", equalTo(ALLOWED_ORIGIN))
        .header("Access-Control-Allow-Methods", containsString("POST"))
        .header("Access-Control-Allow-Headers", containsString("X-CSRF-Token"));
  }

  @Test
  void shouldNotGrantCsrfHeaderToUnconfiguredOrigin() {
    Response response = given()
        .header("Origin", UNALLOWED_ORIGIN)
        .header("Access-Control-Request-Method", "POST")
        .header("Access-Control-Request-Headers", "X-CSRF-Token")
        .when()
        .options("/auth/refresh");

    assertEquals(403, response.statusCode());
    assertNull(response.getHeader("Access-Control-Allow-Origin"));
  }
}
