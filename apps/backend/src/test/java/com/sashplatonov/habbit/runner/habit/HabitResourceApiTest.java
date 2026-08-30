package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.support.AuthenticatedApiTestSupport;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
class HabitResourceApiTest extends AuthenticatedApiTestSupport {
  private String token;

  @BeforeEach
  void setUp() throws Exception {
    token = createAuthenticatedUser().accessToken();
  }

  @Test
  void shouldRejectInvalidScheduleOnCreateBeforePersistence() {
    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body("""
            {
              "id": "invalid-create",
              "name": "Read",
              "color": "blue",
              "icon": "book",
              "frequency": "daily",
              "targetStreak": 1,
              "dailyTarget": 1,
              "type": "positive",
              "schedule": {"type": "weekly_days", "weekdays": []}
            }
            """)
        .when()
        .post("/habits")
        .then()
        .statusCode(400)
        .body("title", equalTo("Constraint Violation"))
        .body("errorCode", equalTo("VALIDATION_FAILED"))
        .body("detail", containsString("schedule"));
  }

  @Test
  void shouldRejectInvalidScheduleOnUpdateBeforePersistence() {
    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body("""
            {
              "schedule": {"type": "monthly_weeks", "weekdays": [1], "weeksOfMonth": []}
            }
            """)
        .when()
        .put("/habits/not-created")
        .then()
        .statusCode(400)
        .body("title", equalTo("Constraint Violation"))
        .body("errorCode", equalTo("VALIDATION_FAILED"))
        .body("detail", containsString("schedule"));
  }
}
