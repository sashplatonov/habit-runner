package com.sashplatonov.habbit.runner.notification;

import com.sashplatonov.habbit.runner.api.OperationFailure;
import com.sashplatonov.habbit.runner.api.OperationSuccess;
import com.sashplatonov.habbit.runner.model.PushSubscriptionEntity;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionEndpointRequest;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionKeys;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionRequest;
import com.sashplatonov.habbit.runner.notification.dto.SubscriptionStatusResponse;
import com.sashplatonov.habbit.runner.notification.dto.VapidPublicKeyResponse;
import com.sashplatonov.habbit.runner.repository.PushSubscriptionRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;

class NotificationServiceUnitCoverageTest {

  @Test
  void shouldReturnFailureWhenVapidKeyIsMissing() {
    var service = new NotificationServiceImpl(() -> Optional.empty(), new StubPushSubscriptionRepository());

    var result = service.getVapidPublicKey();

    var failure = assertInstanceOf(OperationFailure.class, result);
    var failureErr = failure.toErrorResponse();
    assertEquals(503, failureErr.status());
    assertEquals("VAPID_PUBLIC_KEY_MISSING", failureErr.errorCode());
  }

  @Test
  void shouldHandleSubscribeAndUnsubscribeScenarios() {
    var repository = new StubPushSubscriptionRepository();
    var service = new NotificationServiceImpl(() -> Optional.of("public-key"), repository);
    var request = new PushSubscriptionRequest(
        "https://push.example/subscriptions/1",
        new PushSubscriptionKeys("p256dh-key", "auth-key")
    );

    var vapid = assertInstanceOf(OperationSuccess.class, service.getVapidPublicKey());
    var vapidValue = assertInstanceOf(VapidPublicKeyResponse.class, vapid.value());
    assertEquals("public-key", vapidValue.publicKey());

    var created = assertInstanceOf(OperationSuccess.class, service.subscribe("user-1", request));
    assertEquals(new SubscriptionStatusResponse(true), assertInstanceOf(SubscriptionStatusResponse.class, created.value()));
    assertEquals("user-1", repository.getSavedUserId());
    assertEquals("https://push.example/subscriptions/1", repository.getSavedEndpoint());

    repository.promoteSavedToExisting();
    var alreadyOwned = assertInstanceOf(OperationSuccess.class, service.subscribe("user-1", request));
    assertEquals(new SubscriptionStatusResponse(true), assertInstanceOf(SubscriptionStatusResponse.class, alreadyOwned.value()));

    var foreign = new PushSubscriptionEntity();
    foreign.userId = "other-user";
    foreign.endpoint = request.endpoint();
    repository.setExisting(foreign);
    var subscribeConflict = assertInstanceOf(OperationFailure.class, service.subscribe("user-1", request));
    var subscribeErr = subscribeConflict.toErrorResponse();
    assertEquals(409, subscribeErr.status());
    assertEquals("SUBSCRIPTION_ENDPOINT_CONFLICT", subscribeErr.errorCode());

    var unsubscribeConflict = assertInstanceOf(
        OperationFailure.class,
        service.unsubscribe("user-1", new PushSubscriptionEndpointRequest(request.endpoint()))
    );
    var unsubscribeErr = unsubscribeConflict.toErrorResponse();
    assertEquals(403, unsubscribeErr.status());
    assertEquals("SUBSCRIPTION_ENDPOINT_FORBIDDEN", unsubscribeErr.errorCode());

    repository.promoteSavedToExisting();
    var removed = assertInstanceOf(
        OperationSuccess.class,
        service.unsubscribe("user-1", new PushSubscriptionEndpointRequest(request.endpoint()))
    );
    assertNull(removed.value());
    assertEquals(request.endpoint(), repository.getDeletedEndpoint());
  }
}
