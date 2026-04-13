package com.sashplatonov.habbit.runner.notification;

import com.sashplatonov.habbit.runner.auth.CurrentUser;
import com.sashplatonov.habbit.runner.auth.CurrentUserContext;
import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.model.PushSubscriptionEntity;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionEndpointRequest;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionKeys;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionRequest;
import com.sashplatonov.habbit.runner.notification.dto.SubscriptionStatusResponse;
import com.sashplatonov.habbit.runner.notification.dto.VapidPublicKeyResponse;
import com.sashplatonov.habbit.runner.repository.PushSubscriptionRepository;
import com.sashplatonov.habbit.runner.support.AuthenticatedApiTestSupport;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
@SuppressWarnings("PMD.LawOfDemeter")
class NotificationResourceCoverageTest extends AuthenticatedApiTestSupport {

VAPID_PUBLIC_KEY=

  @Inject
  PushSubscriptionRepository pushSubscriptionRepository;

  private String userId;
  private String email;

  @BeforeEach
  void setUp() throws Exception {
    var user = createAuthenticatedUser("cloud");
    userId = user.id();
    email = user.email();
  }

  @Test
  void shouldReturnConfiguredPublicKeyWhenDirectResourceCallUsesConfiguredValue() {
    var response =<REDACTED>

    assertEquals(200, response.getStatus());
    assertEquals(TEST_VAPID_PUBLIC_KEY, ((VapidPublicKeyResponse) response.getEntity()).publicKey());
  }

  @Test
  void shouldReturnServiceUnavailableWhenDirectResourceCallUsesBlankConfiguredValue() {
    var resource = resourceWithUser(" ");
    var response = resource.getVapidPublicKey();

    assertEquals(503, response.getStatus());
    assertEquals("VAPID_PUBLIC_KEY_MISSING", ((ErrorResponse) response.getEntity()).errorCode());
  }

  @Test
  void shouldPersistSubscriptionWhenDirectResourceSubscribeReceivesNewEndpoint() throws Exception {
    var endpoint = subscriptionEndpoint();
    var resource =<REDACTED>

    var response = inTransaction(() -> {
      return resource.subscribe(new PushSubscriptionRequest(
        endpoint,
        new PushSubscriptionKeys("p256dh-key", "auth-key")
      ));
    });

    assertEquals(201, response.getStatus());
    assertTrue(subscriptionStatus(response).success());
    assertEquals(1L, PushSubscriptionEntity.count("endpoint", endpoint));
  }

  @Test
  void shouldSkipPersistWhenDirectResourceSubscribeReceivesExistingEndpoint() throws Exception {
    var endpoint = subscriptionEndpoint();
    var resource =<REDACTED>

    inTransaction(() -> resource.subscribe(new PushSubscriptionRequest(endpoint, new PushSubscriptionKeys("first", "first"))));
    inTransaction(() -> resource.subscribe(new PushSubscriptionRequest(endpoint, new PushSubscriptionKeys("second", "second"))));

    var stored = PushSubscriptionEntity.<PushSubscriptionEntity>find("endpoint", endpoint).firstResult();
    assertEquals(1L, PushSubscriptionEntity.count("endpoint", endpoint));
    assertEquals("first", stored.p256dh);
    assertEquals("first", stored.auth);
  }

  @Test
  void shouldDeleteSubscriptionWhenDirectResourceUnsubscribeReceivesEndpoint() throws Exception {
    var endpoint = subscriptionEndpoint();
    var resource =<REDACTED>

    inTransaction(() -> resource.subscribe(new PushSubscriptionRequest(endpoint, new PushSubscriptionKeys("p256dh", "auth"))));
    var response = inTransaction(() -> {
      return resource.unsubscribe(new PushSubscriptionEndpointRequest(endpoint));
    });

    assertEquals(204, response.getStatus());
    assertEquals(0L, PushSubscriptionEntity.count("endpoint", endpoint));
  }

  @Test
  void shouldIgnoreNullEndpointWhenDirectResourceUnsubscribeReceivesMissingBody() throws Exception {
    var resource =<REDACTED>

    var response = inTransaction(() -> {
      return resource.unsubscribe(new PushSubscriptionEndpointRequest(null));
    });

    assertEquals(204, response.getStatus());
  }

  private NotificationResource resourceWithUser(String vapidPublicKey) {
    var currentUserContext = new CurrentUserContext();
    currentUserContext.setUser(new CurrentUser(userId, email));
    return new NotificationResource(
        new NotificationServiceImpl(TestConfigFactory.notificationConfig(vapidPublicKey), pushSubscriptionRepository),
        currentUserContext
    );
  }

  private NotificationResource directResource(String vapidPublicKey) {
    return resourceWithUser(vapidPublicKey);
  }

  private SubscriptionStatusResponse subscriptionStatus(jakarta.ws.rs.core.Response response) {
    return (SubscriptionStatusResponse) response.getEntity();
  }

  private String subscriptionEndpoint() {
    return "https://push.example/direct/" + UUID.randomUUID();
  }
}