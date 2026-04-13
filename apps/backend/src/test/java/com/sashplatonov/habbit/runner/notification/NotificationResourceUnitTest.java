package com.sashplatonov.habbit.runner.notification;

import com.sashplatonov.habbit.runner.auth.CurrentUser;
import com.sashplatonov.habbit.runner.auth.CurrentUserContext;
import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionEndpointRequest;
import com.sashplatonov.habbit.runner.notification.dto.VapidPublicKeyResponse;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SuppressWarnings("PMD.LawOfDemeter")
class NotificationResourceUnitTest {

  @Test
  void shouldReturnConfiguredVapidPublicKeyForDirectUnitResource() {
    var response = resource("unit-public-key").getVapidPublicKey();

    assertEquals(200, response.getStatus());
    assertEquals("unit-public-key", ((VapidPublicKeyResponse) response.getEntity()).publicKey());
  }

  @Test
  void shouldReturnServiceUnavailableWhenConfiguredVapidPublicKeyIsBlank() {
    var response = resource(" ").getVapidPublicKey();

    assertEquals(503, response.getStatus());
    assertEquals("VAPID_PUBLIC_KEY_MISSING", ((ErrorResponse) response.getEntity()).errorCode());
  }

  @Test
  void shouldReturnNoContentWhenUnsubscribeBodyHasNoEndpoint() {
    var response = resource("unit-public-key").unsubscribe(new PushSubscriptionEndpointRequest(null));

    assertEquals(204, response.getStatus());
  }

  private NotificationResource resource(String vapidPublicKey) {
    var currentUserContext = new CurrentUserContext();
    currentUserContext.setUser(new CurrentUser("user-1", "user@example.test"));
    return new NotificationResource(
        new NotificationServiceImpl(() -> java.util.Optional.ofNullable(vapidPublicKey), null),
        currentUserContext
    );
  }
}