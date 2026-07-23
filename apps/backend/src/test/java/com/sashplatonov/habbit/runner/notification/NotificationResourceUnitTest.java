package com.sashplatonov.habbit.runner.notification;

import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionEndpointRequest;
import com.sashplatonov.habbit.runner.notification.dto.VapidPublicKeyResponse;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import com.sashplatonov.habbit.runner.support.TestHelpers;

class NotificationResourceUnitTest {

  @Test
  void shouldReturnConfiguredVapidPublicKeyForDirectUnitResource() {
    var res = resource("unit-public-key");
    var response = res.getVapidPublicKey();

    assertEquals(200, TestHelpers.statusOf(response));
    var vapid = TestHelpers.entityOf(response, VapidPublicKeyResponse.class);
    assertEquals("unit-public-key", vapid.publicKey());
  }

  @Test
  void shouldReturnServiceUnavailableWhenConfiguredVapidPublicKeyIsBlank() {
    var res = resource(" ");
    var response = res.getVapidPublicKey();

    assertEquals(503, TestHelpers.statusOf(response));
    var err = TestHelpers.entityOf(response, ErrorResponse.class);
    assertEquals("VAPID_PUBLIC_KEY_MISSING", err.errorCode());
  }

  @Test
  void shouldReturnNoContentWhenUnsubscribeBodyHasNoEndpoint() {
    var response = resource("unit-public-key").unsubscribe(new PushSubscriptionEndpointRequest(null));

    assertEquals(204, TestHelpers.statusOf(response));
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
