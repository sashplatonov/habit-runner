package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.service.AuthService;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitService;
import com.sashplatonov.habbit.runner.auth.support.AuthResourceSupport;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramInitDataVerifier;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramSessionRequest;
import com.sashplatonov.habbit.runner.auth.dto.TelegramSessionResponse;
import com.sashplatonov.habbit.runner.api.ClientIpResolver;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;

@Path("/auth/telegram")
@Produces(MediaType.APPLICATION_JSON)
public class TelegramAuthResource {
  private final AuthService authService;
  private final TelegramInitDataVerifier verifier;
  private final AuthCookieBuilder cookieBuilder;
  private final AuthRateLimitService rateLimitService;
  @Context
  HttpHeaders headers;

  public TelegramAuthResource(AuthService authService, TelegramInitDataVerifier verifier,
      AuthResourceSupport support) {
    this.authService = authService;
    this.verifier = verifier;
    this.cookieBuilder = support.cookieBuilder();
    this.rateLimitService = support.rateLimitService();
  }

  @POST
  @Path("/session")
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Authenticate Telegram Mini App session")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "Authenticated Telegram session",
          content = @Content(schema = @Schema(implementation = TelegramSessionResponse.class))),
      @APIResponse(responseCode = "400", description = "Telegram authentication rejected")
  })
  public Response session(@Valid @NotNull TelegramSessionRequest request) {
    rateLimitService.checkIp("auth:telegram:session", ClientIpResolver.resolve(headers), 20, 60L);
    var token = authService.authenticateTelegram(verifier.verify(request.initData()));
    var csrf = UUID.randomUUID().toString().replace("-", "");
    var maxAge = authService.refreshTokenDays() * 24 * 60 * 60;
    return Response.ok(new TelegramSessionResponse(
            authService.verifyAccessToken(token.accessToken()).id(),
            authService.verifyAccessToken(token.accessToken()).email(),
            token.existingAccount()))
        .cookie(cookieBuilder.accessToken(token.accessToken(), token.expiresIn()))
        .cookie(cookieBuilder.refreshToken(token.refreshToken(), maxAge))
        .cookie(cookieBuilder.csrfToken(csrf, maxAge))
        .build();
  }
}
