package com.sashplatonov.habbit.runner.notification;

import com.sashplatonov.habbit.runner.model.PushSubscriptionEntity;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionEndpointRequest;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionKeys;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionRequest;
import com.sashplatonov.habbit.runner.support.AuthenticatedApiTestSupport;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@QuarkusTest
class NotificationResourceTest extends AuthenticatedApiTestSupport {

VAPID_PUBLIC_KEY=

  private String userId;
  private String token;

  @BeforeEach
  void setUp() throws Exception {
    var user = createAuthenticatedUser("cloud");
    userId = user.id();
    token = user.accessToken();
  }

  @Test
  void shouldReturnConfiguredVapidPublicKeyWhenRequested() {
    given()
        .when()
        .get("/notifications/vapid-public-key")
        .then()
        .statusCode(200)
        .body("publicKey", equalTo(TEST_VAPID_PUBLIC_KEY));
  }

  @Test
  void shouldStoreSubscriptionWhenAuthorizedUserSubscribes() {
    var endpoint = subscriptionEndpoint();

    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(new PushSubscriptionRequest(endpoint, new PushSubscriptionKeys("p256dh-key", "auth-key")))
        .when()
        .post("/notifications/subscribe")
        .then()
        .statusCode(201)
        .body("success", equalTo(true));

    var stored = PushSubscriptionEntity.<PushSubscriptionEntity>find("endpoint", endpoint).firstResult();
    assertNotNull(stored);
    assertEquals(userId, stored.getUserId());
    assertEquals("p256dh-key", stored.getP256dh());
    assertEquals("auth-key", stored.getAuth());
  }

  @Test
  void shouldStoreEmptyKeysWhenSubscriptionKeysMissing() {
    var endpoint = subscriptionEndpoint();

    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(new PushSubscriptionRequest(endpoint, null))
        .when()
        .post("/notifications/subscribe")
        .then()
        .statusCode(400)
        .body("title", equalTo("Constraint Violation"))
        .body("detail", containsString("must not be null"));
  }

  @Test
  void shouldNotCreateDuplicateSubscriptionWhenEndpointAlreadyExists() {
    var endpoint = subscriptionEndpoint();
    var request = new PushSubscriptionRequest(endpoint, new PushSubscriptionKeys("p256dh-key", "auth-key"));

    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(request)
        .when()
        .post("/notifications/subscribe")
        .then()
        .statusCode(201)
        .body("success", equalTo(true));

    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(request)
        .when()
        .post("/notifications/subscribe")
        .then()
        .statusCode(201)
        .body("success", equalTo(true));

    assertEquals(1L, PushSubscriptionEntity.count("endpoint", endpoint));
  }

  @Test
  void shouldDeleteSubscriptionWhenAuthorizedUserUnsubscribes() {
    var endpoint = subscriptionEndpoint();

    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(new PushSubscriptionRequest(endpoint, new PushSubscriptionKeys("p256dh-key", "auth-key")))
        .when()
        .post("/notifications/subscribe")
        .then()
        .statusCode(201);

    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(new PushSubscriptionEndpointRequest(endpoint))
        .when()
        .delete("/notifications/unsubscribe")
        .then()
        .statusCode(204);

    assertEquals(0L, PushSubscriptionEntity.count("endpoint", endpoint));
  }

  @Test
  void shouldReturn401WhenSubscribingWithoutAccessToken() {
    given()
        .contentType(ContentType.JSON)
        .body(new PushSubscriptionRequest(subscriptionEndpoint(), new PushSubscriptionKeys("p256dh-key", "auth-key")))
        .when()
        .post("/notifications/subscribe")
        .then()
      .statusCode(403)
      .body("status", equalTo(403))
      .body("detail", equalTo("Authentication required"))
      .body("errorCode", equalTo("AUTH_REQUIRED"));
  }

  @Test
  void shouldReturn401WhenUnsubscribingWithoutAccessToken() {
    given()
        .contentType(ContentType.JSON)
        .body(new PushSubscriptionEndpointRequest(subscriptionEndpoint()))
        .when()
        .delete("/notifications/unsubscribe")
        .then()
      .statusCode(403)
      .body("status", equalTo(403))
      .body("detail", equalTo("Authentication required"))
      .body("errorCode", equalTo("AUTH_REQUIRED"));
  }

  @Test
  void shouldReturn409WhenEndpointAlreadyRegisteredByAnotherUser() throws Exception {
    var endpoint = subscriptionEndpoint();
    var otherUser = createAuthenticatedUser("cloud");

    // Other user subscribes first
    given()
        .header("Authorization", "Bearer " + otherUser.accessToken())
        .contentType(ContentType.JSON)
        .body(new PushSubscriptionRequest(endpoint, new PushSubscriptionKeys("p256dh-key", "auth-key")))
        .when()
        .post("/notifications/subscribe")
        .then()
        .statusCode(201);

    // Our user tries to claim the same endpoint
    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(new PushSubscriptionRequest(endpoint, new PushSubscriptionKeys("p256dh-key2", "auth-key2")))
        .when()
        .post("/notifications/subscribe")
        .then()
        .statusCode(409)
        .body("status", equalTo(409));
  }

  private String subscriptionEndpoint() {
    return "https://push.example/subscriptions/" + UUID.randomUUID();
  }
}
