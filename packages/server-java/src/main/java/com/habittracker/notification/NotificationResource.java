package com.habittracker.notification;

import com.habittracker.auth.CurrentUserContext;
import com.habittracker.auth.RequireAuth;
import com.habittracker.model.PushSubscriptionEntity;
import io.quarkus.hibernate.orm.panache.Panache;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Map;

@Path("/notifications")
@Produces(MediaType.APPLICATION_JSON)
public class NotificationResource {
  @ConfigProperty(name = "notification.vapid-public-key")
  java.util.Optional<String> vapidPublicKey;

  final CurrentUserContext currentUserContext;

  public NotificationResource(CurrentUserContext currentUserContext) {
    this.currentUserContext = currentUserContext;
  }

  @GET
  @Path("/vapid-public-key")
  public Map<String, String> getVapidPublicKey() {
    var key = vapidPublicKey.filter(s -> !s.isBlank()).orElseThrow(
        () -> new IllegalStateException("VAPID_PUBLIC_KEY not configured"));
    return Map.of("publicKey", key);
  }

  @RequireAuth
  @POST
  @Path("/subscribe")
  @Transactional
  public Response subscribe(PushSubscriptionRequest body) {
    var userId = currentUserContext.requireUser().id();

    var existing = PushSubscriptionEntity.find("endpoint", body.endpoint()).firstResult();
    if (existing == null) {
      var entity = new PushSubscriptionEntity();
      entity.userId = userId;
      entity.endpoint = body.endpoint();
      entity.p256dh = body.keys() == null ? "" : body.keys().p256dh();
      entity.auth = body.keys() == null ? "" : body.keys().auth();
      entity.persist();
    }

    return Response.status(201).entity(Map.of("success", true)).build();
  }

  @RequireAuth
  @DELETE
  @Path("/unsubscribe")
  @Transactional
  public Response unsubscribe(Map<String, String> body) {
    var endpoint = body == null ? null : body.get("endpoint");
    if (endpoint != null) {
      Panache.executeUpdate("delete from PushSubscriptionEntity where endpoint = ?1", endpoint);
    }
    return Response.status(204).build();
  }

  public record PushSubscriptionRequest(String endpoint, PushSubscriptionKeys keys) {
  }

  public record PushSubscriptionKeys(String p256dh, String auth) {
  }
}
