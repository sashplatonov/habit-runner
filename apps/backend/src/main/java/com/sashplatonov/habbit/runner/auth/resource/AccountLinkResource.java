package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.identity.AccountLinkService;
import com.sashplatonov.habbit.runner.auth.identity.AccountConnectionService;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.auth.service.AuthService;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramLinkRequest;
import com.sashplatonov.habbit.runner.auth.dto.AuthSessionResponse;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;

@Path("/auth/link")
@Produces(MediaType.APPLICATION_JSON)
public class AccountLinkResource {
  @Inject
  AccountLinkService accountLinkService;
  @Inject
  CurrentUserContext currentUserContext;
  @Inject
  AccountConnectionService accountConnectionService;
  @Inject
  AuthService authService;
  @Inject
  AuthCookieBuilder authCookieBuilder;

  @Inject
  AccountLinkResource(AccountLinkService accountLinkService, CurrentUserContext currentUserContext) {
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
  public Response completeTelegramLink(
      @Valid @NotNull TelegramLinkRequest request,
      @CookieParam(AuthCookieBuilder.CSRF_TOKEN_COOKIE) String csrfToken
  ) {
    currentUserContext.requireUser();
    var ownerUserId = accountLinkService.completeTelegramLink(request.token(), request.initData());
    var session = authService.issueSessionForUserId(ownerUserId);
    var owner = authService.verifyAccessToken(session.accessToken());
    var nextCsrfToken = csrfToken == null || csrfToken.isBlank()
        ? UUID.randomUUID().toString().replace("-", "") : csrfToken;
    return Response.ok(new AuthSessionResponse(owner.id(), owner.email()))
        .cookie(authCookieBuilder.accessToken(session.accessToken(), session.expiresIn()))
        .cookie(authCookieBuilder.refreshToken(session.refreshToken(), authService.refreshTokenDays() * 24 * 60 * 60))
        .cookie(authCookieBuilder.csrfToken(nextCsrfToken, authService.refreshTokenDays() * 24 * 60 * 60))
        .build();
  }

  @RequireAuth
  @GET
  @Path("/telegram/connection")
  public Response telegramConnection() {
    return Response.ok(java.util.Map.of("connected", accountLinkService.isTelegramLinked(
        currentUserContext.requireUser().id()))).build();
  }

  @RequireAuth
  @GET
  @Path("/connections")
  public com.sashplatonov.habbit.runner.auth.dto.AccountConnectionsResponse connections() {
    return accountConnectionService.connections(currentUserContext.requireUser().id());
  }

  @RequireAuth
  @DELETE
  @Path("/connections/{provider}")
  public Response detach(@PathParam("provider") String provider) {
    accountConnectionService.detach(currentUserContext.requireUser().id(), provider);
    return Response.noContent().build();
  }

}
