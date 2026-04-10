package com.habittracker.notification;

import com.habittracker.auth.CurrentUser;
import com.habittracker.auth.CurrentUserContext;
import com.habittracker.notification.dto.PushSubscriptionEndpointRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SuppressWarnings("PMD.LawOfDemeter")
class NotificationResourceUnitTest {

  @Test
  void shouldReturnConfiguredVapidPublicKeyForDirectUnitResource() {
    var response = resource("unit-public-key").getVapidPublicKey();

    assertEquals("unit-public-key", response.publicKey());
  }

  @Test
  void shouldThrowWhenConfiguredVapidPublicKeyIsBlank() {
    assertThrows(IllegalStateException.class, () -> resource(" ").getVapidPublicKey());
  }

  @Test
  void shouldReturnNoContentWhenUnsubscribeBodyHasNoEndpoint() {
    var response = resource("unit-public-key").unsubscribe(new PushSubscriptionEndpointRequest(null));

    assertEquals(204, response.getStatus());
  }

  private NotificationResource resource(String vapidPublicKey) {
    var currentUserContext = new CurrentUserContext();
    currentUserContext.setUser(new CurrentUser("user-1", "user@example.test"));
    return new NotificationResource(() -> java.util.Optional.ofNullable(vapidPublicKey), currentUserContext);
  }
}