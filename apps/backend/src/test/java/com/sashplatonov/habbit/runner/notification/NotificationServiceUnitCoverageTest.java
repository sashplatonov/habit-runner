package com.sashplatonov.habbit.runner.notification;

import com.sashplatonov.habbit.runner.api.OperationResult;
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

    var failure = assertInstanceOf(OperationResult.Failure.class, result);
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

    var vapid = assertInstanceOf(OperationResult.Success.class, service.getVapidPublicKey());
    var vapidValue = assertInstanceOf(VapidPublicKeyResponse.class, vapid.value());
    assertEquals("public-key", vapidValue.publicKey());

    var created = assertInstanceOf(OperationResult.Success.class, service.subscribe("user-1", request));
    assertEquals(new SubscriptionStatusResponse(true), assertInstanceOf(SubscriptionStatusResponse.class, created.value()));
    assertEquals("user-1", repository.getSavedUserId());
    assertEquals("https://push.example/subscriptions/1", repository.getSavedEndpoint());

    repository.promoteSavedToExisting();
    var alreadyOwned = assertInstanceOf(OperationResult.Success.class, service.subscribe("user-1", request));
    assertEquals(new SubscriptionStatusResponse(true), assertInstanceOf(SubscriptionStatusResponse.class, alreadyOwned.value()));

    var foreign = new PushSubscriptionEntity();
    foreign.userId = "other-user";
    foreign.endpoint = request.endpoint();
    repository.setExisting(foreign);
    var subscribeConflict = assertInstanceOf(OperationResult.Failure.class, service.subscribe("user-1", request));
    var subscribeErr = subscribeConflict.toErrorResponse();
    assertEquals(409, subscribeErr.status());
    assertEquals("SUBSCRIPTION_ENDPOINT_CONFLICT", subscribeErr.errorCode());

    var unsubscribeConflict = assertInstanceOf(
        OperationResult.Failure.class,
        service.unsubscribe("user-1", new PushSubscriptionEndpointRequest(request.endpoint()))
    );
    var unsubscribeErr = unsubscribeConflict.toErrorResponse();
    assertEquals(403, unsubscribeErr.status());
    assertEquals("SUBSCRIPTION_ENDPOINT_FORBIDDEN", unsubscribeErr.errorCode());

    repository.promoteSavedToExisting();
    var removed = assertInstanceOf(
        OperationResult.Success.class,
        service.unsubscribe("user-1", new PushSubscriptionEndpointRequest(request.endpoint()))
    );
    assertNull(removed.value());
    assertEquals(request.endpoint(), repository.getDeletedEndpoint());
  }

  private static final class StubPushSubscriptionRepository extends PushSubscriptionRepository {
    private PushSubscriptionEntity existing;
    private PushSubscriptionEntity savedEntity;
    private String deletedEndpoint;

    @Override
    public PushSubscriptionEntity findByEndpoint(String endpoint) {
      return existing;
    }

    @Override
    public void save(PushSubscriptionEntity entity) {
      savedEntity = entity;
      existing = entity;
    }

    @Override
    public long deleteByEndpoint(String endpoint) {
      deletedEndpoint = endpoint;
      existing = null;
      return 1L;
    }

    public PushSubscriptionEntity getSavedEntity() { return savedEntity; }
    public void setExisting(PushSubscriptionEntity e) { existing = e; }
    public String getDeletedEndpoint() { return deletedEndpoint; }
    public String getSavedUserId() { return savedEntity == null ? null : savedEntity.userId; }
    public String getSavedEndpoint() { return savedEntity == null ? null : savedEntity.endpoint; }
    public void promoteSavedToExisting() { existing = savedEntity; }
  }
}