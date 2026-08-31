package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.identity.AccountLinkService;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.auth.service.TelegramLinkCompletionService;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramLinkRequest;
import com.sashplatonov.habbit.runner.auth.dto.AuthSessionResponse;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;
import java.util.UUID;

@Path("/auth/link")
@Produces(MediaType.APPLICATION_JSON)
public class TelegramLinkResource {
  final AccountLinkService accountLinkService;
  final CurrentUserContext currentUserContext;
  final TelegramLinkCompletionService telegramLinkCompletionService;
  final AuthCookieBuilder authCookieBuilder;

  @Inject
  TelegramLinkResource(
      AccountLinkService accountLinkService,
      CurrentUserContext currentUserContext,
      TelegramLinkCompletionService telegramLinkCompletionService,
      AuthCookieBuilder authCookieBuilder
  ) {
    this.accountLinkService = accountLinkService;
    this.currentUserContext = currentUserContext;
    this.telegramLinkCompletionService = telegramLinkCompletionService;
    this.authCookieBuilder = authCookieBuilder;
  }

  @RequireAuth
  @POST
  @Path("/telegram/start")
  public Response startTelegramLink() {
    return Response.ok(Map.of("token", accountLinkService.startTelegramLink(
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
    var session = telegramLinkCompletionService.complete(request.token(), request.initData());
    var owner = session.user();
    var nextCsrfToken = csrfToken == null || csrfToken.isBlank()
        ? UUID.randomUUID().toString().replace("-", "") : csrfToken;
    return Response.ok(new AuthSessionResponse(owner.id(), owner.email()))
        .cookie(authCookieBuilder.accessToken(session.token().accessToken(), session.token().expiresIn()))
        .cookie(authCookieBuilder.refreshToken(session.token().refreshToken(),
            authCookieBuilder.refreshTokenMaxAgeSeconds()))
        .cookie(authCookieBuilder.csrfToken(nextCsrfToken, authCookieBuilder.refreshTokenMaxAgeSeconds()))
        .build();
  }

  @RequireAuth
  @GET
  @Path("/telegram/connection")
  public Response telegramConnection() {
    return Response.ok(Map.of("connected", accountLinkService.isTelegramLinked(
        currentUserContext.requireUser().id()))).build();
  }
}
