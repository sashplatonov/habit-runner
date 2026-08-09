package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.identity.AccountLinkService;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramLinkRequest;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/auth/link")
@Produces(MediaType.APPLICATION_JSON)
public class AccountLinkResource {
  private final AccountLinkService accountLinkService;
  private final CurrentUserContext currentUserContext;

  @Inject
  public AccountLinkResource(AccountLinkService accountLinkService, CurrentUserContext currentUserContext) {
    this.accountLinkService = accountLinkService;
    this.currentUserContext = currentUserContext;
  }

  @RequireAuth
  @POST
  @Path("/telegram/start")
  public Response startTelegramLink() {
    return Response.ok(java.util.Map.of("token", accountLinkService.startTelegramLink(
        currentUserContext.requireUser().id()))).build();
  }

  @RequireAuth
  @POST
  @Path("/telegram/complete")
  @Consumes(MediaType.APPLICATION_JSON)
  public Response completeTelegramLink(@Valid @NotNull TelegramLinkRequest request) {
    accountLinkService.completeTelegramLink(currentUserContext.requireUser().id(), request.token(), request.initData());
    return Response.noContent().build();
  }

  @RequireAuth
  @POST
  @Path("/telegram/confirm")
  @Consumes(MediaType.APPLICATION_JSON)
  public Response confirmTelegramLink(@Valid @NotNull TelegramLinkRequest request) {
    accountLinkService.confirmTelegramLink(currentUserContext.requireUser().id(), request.token());
    return Response.noContent().build();
  }

  @RequireAuth
  @GET
  @Path("/telegram/status")
  public Response telegramLinkStatus(@QueryParam("token") String token) {
    return Response.ok(java.util.Map.of("status", accountLinkService.status(
        currentUserContext.requireUser().id(), token))).build();
  }

  @RequireAuth
  @DELETE
  @Path("/telegram")
  public Response cancelTelegramLink(@QueryParam("token") String token) {
    accountLinkService.cancel(currentUserContext.requireUser().id(), token);
    return Response.noContent().build();
  }
}
