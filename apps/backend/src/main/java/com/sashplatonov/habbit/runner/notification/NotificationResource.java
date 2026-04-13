package com.sashplatonov.habbit.runner.notification;

import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.api.OperationResult;
import com.sashplatonov.habbit.runner.auth.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.RequireAuth;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionEndpointRequest;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionRequest;
import com.sashplatonov.habbit.runner.notification.dto.SubscriptionStatusResponse;
import com.sashplatonov.habbit.runner.notification.dto.VapidPublicKeyResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/notifications")
@Produces(MediaType.APPLICATION_JSON)
@Slf4j
@Tag(name = "Notifications")
public class NotificationResource {
  final NotificationService notificationService;
  final CurrentUserContext currentUserContext;

  public NotificationResource(NotificationService notificationService, CurrentUserContext currentUserContext) {
    this.notificationService = notificationService;
    this.currentUserContext = currentUserContext;
  }

  @GET
  @Path("/vapid-public-key")
  @Operation(summary = "Get VAPID public key", description = "Returns the public VAPID key used by web push clients.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "VAPID public key",
          content = @Content(schema = @Schema(implementation = VapidPublicKeyResponse.class))),
      @APIResponse(responseCode = "503", description = "VAPID key missing",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response getVapidPublicKey() {
    return toResponse(notificationService.getVapidPublicKey(), Response.Status.OK, false);
  }

  @RequireAuth
  @POST
  @Path("/subscribe")
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Subscribe to push notifications", description = "Stores the browser push subscription for the authenticated user.")
  @APIResponses({
      @APIResponse(responseCode = "201", description = "Subscription stored",
          content = @Content(schema = @Schema(implementation = SubscriptionStatusResponse.class))),
      @APIResponse(responseCode = "400", description = "Validation failed",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
      @APIResponse(responseCode = "403", description = "Authentication required",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
      @APIResponse(responseCode = "409", description = "Subscription endpoint already owned",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response subscribe(@Valid @NotNull PushSubscriptionRequest body) {
    var userId = currentUserContext.requireUser().id();
    return toResponse(notificationService.subscribe(userId, body), Response.Status.CREATED, true);
  }

  @RequireAuth
  @DELETE
  @Path("/unsubscribe")
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Unsubscribe from push notifications",
      description = "Removes the stored browser push subscription for the authenticated user.")
  @APIResponses({
      @APIResponse(responseCode = "204", description = "Subscription removed"),
      @APIResponse(responseCode = "400", description = "Validation failed",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
      @APIResponse(responseCode = "403", description = "Authentication required or endpoint not owned",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response unsubscribe(@Valid @NotNull PushSubscriptionEndpointRequest body) {
    if (body == null || body.endpoint() == null || body.endpoint().isBlank()) {
      return Response.noContent().build();
    }
    var userId = currentUserContext.requireUser().id();
    var result = notificationService.unsubscribe(userId, body);
    if (result instanceof OperationResult.Success<Void>) {
      return Response.noContent().build();
    }
    var failure = (OperationResult.Failure<Void>) result;
    var error = failure.toErrorResponse();
    return Response.status(error.status()).entity(error).build();
  }

  private <T> Response toResponse(OperationResult<T> result, Response.Status status, boolean created) {
    if (result instanceof OperationResult.Success<T> success) {
      return created
          ? Response.status(status).entity(success.value()).build()
          : Response.ok(success.value()).build();
    }
    var failure = (OperationResult.Failure<T>) result;
    var error = failure.toErrorResponse();
    return Response.status(error.status()).entity(error).build();
  }
}
