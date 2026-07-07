package com.sashplatonov.habbit.runner.notification;

import com.sashplatonov.habbit.runner.api.OperationResult;
import com.sashplatonov.habbit.runner.model.PushSubscriptionEntity;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionEndpointRequest;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionRequest;
import com.sashplatonov.habbit.runner.notification.dto.SubscriptionStatusResponse;
import com.sashplatonov.habbit.runner.notification.dto.VapidPublicKeyResponse;
import com.sashplatonov.habbit.runner.repository.PushSubscriptionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.extern.slf4j.Slf4j;

@ApplicationScoped
@Slf4j
public class NotificationServiceImpl implements NotificationService {
  private static final String CONFLICT_TYPE = "https://habbit-runner.dev/errors/subscription-conflict";
  private static final String FORBIDDEN_TYPE = "https://habbit-runner.dev/errors/forbidden";
  private static final String CONFIG_TYPE = "https://habbit-runner.dev/errors/configuration";

  private final NotificationConfig notificationConfig;
  private final PushSubscriptionRepository pushSubscriptionRepository;

  public NotificationServiceImpl(
      NotificationConfig notificationConfig,
      PushSubscriptionRepository pushSubscriptionRepository
  ) {
    this.notificationConfig = notificationConfig;
    this.pushSubscriptionRepository = pushSubscriptionRepository;
  }

  @Override
  public OperationResult<VapidPublicKeyResponse> getVapidPublicKey() {
    var key = notificationConfig.vapidPublicKey()
        .filter(value -> !value.isBlank())
        .orElse(null);
    if (key == null) {
      return OperationResult.failure(
          new com.sashplatonov.habbit.runner.api.ErrorResponse(
              CONFIG_TYPE,
              "Service Unavailable",
              jakarta.ws.rs.core.Response.Status.SERVICE_UNAVAILABLE.getStatusCode(),
              "VAPID public key is not configured",
              "VAPID_PUBLIC_KEY_MISSING"
          )
      );
    }
    return OperationResult.success(new VapidPublicKeyResponse(key));
  }

  @Override
  public OperationResult<SubscriptionStatusResponse> subscribe(String userId, PushSubscriptionRequest request) {
    var existing = pushSubscriptionRepository.findByEndpoint(request.endpoint());
    if (existing != null && !userId.equals(existing.userId)) {
      log.warn("event=push_subscription_rejected userId={} reason=endpoint_owned_by_another_user", userId);
      return OperationResult.failure(
          new com.sashplatonov.habbit.runner.api.ErrorResponse(
              CONFLICT_TYPE,
              "Conflict",
              jakarta.ws.rs.core.Response.Status.CONFLICT.getStatusCode(),
              "Subscription endpoint already registered by another user",
              "SUBSCRIPTION_ENDPOINT_CONFLICT"
          )
      );
    }
    if (existing == null) {
      var entity = new PushSubscriptionEntity();
      entity.userId = userId;
      entity.endpoint = request.endpoint();
      entity.p256dh = request.keys().p256dh();
      entity.auth = request.keys().auth();
      pushSubscriptionRepository.save(entity);
      log.debug("event=push_subscription_saved userId={} endpoint={} created=true", userId, request.endpoint());
      return OperationResult.success(new SubscriptionStatusResponse(true));
    }
    log.debug("event=push_subscription_saved userId={} endpoint={} created=false", userId, request.endpoint());
    return OperationResult.success(new SubscriptionStatusResponse(true));
  }

  @Override
  public OperationResult<Void> unsubscribe(String userId, PushSubscriptionEndpointRequest request) {
    var deleted = pushSubscriptionRepository.deleteByEndpointAndUserId(request.endpoint(), userId);
    if (deleted == 0) {
      var existing = pushSubscriptionRepository.findByEndpoint(request.endpoint());
      if (existing != null && !userId.equals(existing.userId)) {
        log.warn("event=push_subscription_unsubscribe_rejected userId={} reason=endpoint_owned_by_another_user", userId);
        return OperationResult.failure(
            new com.sashplatonov.habbit.runner.api.ErrorResponse(
                FORBIDDEN_TYPE,
                "Forbidden",
                jakarta.ws.rs.core.Response.Status.FORBIDDEN.getStatusCode(),
                "Subscription endpoint belongs to another user",
                "SUBSCRIPTION_ENDPOINT_FORBIDDEN"
            )
        );
      }
    }
    if (deleted == 0) {
      log.debug("event=push_subscription_removed userId={} endpoint={} removed=false", userId, request.endpoint());
      return OperationResult.success(null);
    }
    log.debug("event=push_subscription_removed userId={} endpoint={} removed=true", userId, request.endpoint());
    return OperationResult.success(null);
  }
}
