package com.sashplatonov.habbit.runner.notification;

import com.sashplatonov.habbit.runner.api.ApiResponses;
import com.sashplatonov.habbit.runner.auth.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.RequireAuth;
import com.sashplatonov.habbit.runner.model.PushSubscriptionEntity;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionEndpointRequest;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionRequest;
import com.sashplatonov.habbit.runner.notification.dto.SubscriptionStatusResponse;
import com.sashplatonov.habbit.runner.notification.dto.VapidPublicKeyResponse;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;

@Path("/notifications")
@Produces(MediaType.APPLICATION_JSON)
@Slf4j
public class NotificationResource {
  final NotificationConfig notificationConfig;
  final CurrentUserContext currentUserContext;

  public NotificationResource(NotificationConfig notificationConfig, CurrentUserContext currentUserContext) {
    this.notificationConfig = notificationConfig;
    this.currentUserContext = currentUserContext;
  }

  @GET
  @Path("/vapid-public-key")
  public VapidPublicKeyResponse getVapidPublicKey() {
    var key = notificationConfig.vapidPublicKey().filter(value -> !value.isBlank()).orElseThrow(
        () -> new IllegalStateException("VAPID_PUBLIC_KEY not configured"));
    return new VapidPublicKeyResponse(key);
  }

  @RequireAuth
  @POST
  @Path("/subscribe")
  @Transactional
  public Response subscribe(PushSubscriptionRequest body) {
    var userId = currentUserContext.requireUser().id();

    var existing = (PushSubscriptionEntity) PushSubscriptionEntity.find("endpoint", body.endpoint()).firstResult();
    if (existing != null && !userId.equals(existing.userId)) {
      log.warn("Push subscription rejected: userId={}, reason=endpoint-owned-by-another-user", userId);
      throw new WebApplicationException(
          "Subscription endpoint already registered by another user",
          Response.status(Response.Status.CONFLICT).build()
      );
    }
    var created = existing == null;
    if (existing == null) {
      var entity = new PushSubscriptionEntity();
      entity.userId = userId;
      entity.endpoint = body.endpoint();
      entity.p256dh = body.keys() == null ? "" : body.keys().p256dh();
      entity.auth = body.keys() == null ? "" : body.keys().auth();
      entity.persist();
    }

    log.info("Push subscription stored: userId={}, created={}", userId, created);
    return ApiResponses.created(new SubscriptionStatusResponse(true));
  }

  @RequireAuth
  @DELETE
  @Path("/unsubscribe")
  @Transactional
  public Response unsubscribe(PushSubscriptionEndpointRequest body) {
    var userId = currentUserContext.requireUser().id();
    var endpoint = body == null ? null : body.endpoint();
    if (endpoint != null) {
      PushSubscriptionEntity.delete("endpoint", endpoint);
      log.info("Push subscription removed: userId={}, endpointProvided=true", userId);
    } else {
      log.warn("Push subscription removal skipped: userId={}, reason=missing-endpoint", userId);
    }
    return ApiResponses.noContent();
  }
}
