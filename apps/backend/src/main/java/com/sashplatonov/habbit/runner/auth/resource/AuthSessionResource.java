package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.auth.service.RefreshSessionService;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitService;
import com.sashplatonov.habbit.runner.auth.support.AuthResourceSupport;
import com.sashplatonov.habbit.runner.api.ClientIpResolver;
import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.auth.dto.AuthSessionResponse;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetric;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetricsInstrumentation;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Authentication")
public class AuthSessionResource {
  final RefreshSessionService refreshSessionService;
  final AuthCookieBuilder authCookieBuilder;
  final AuthRateLimitService authRateLimitService;
  final CurrentUserContext currentUserContext;
  final ServiceMetricsInstrumentation serviceMetricsInstrumentation;
  @Context
  HttpHeaders headers;

  AuthSessionResource(
      RefreshSessionService refreshSessionService,
      AuthResourceSupport authResourceSupport,
      CurrentUserContext currentUserContext,
      ServiceMetricsInstrumentation serviceMetricsInstrumentation
  ) {
    this.refreshSessionService = refreshSessionService;
    this.authCookieBuilder = authResourceSupport.cookieBuilder();
    this.authRateLimitService = authResourceSupport.rateLimitService();
    this.currentUserContext = currentUserContext;
    this.serviceMetricsInstrumentation = serviceMetricsInstrumentation;
  }

  @POST
  @Path("/refresh")
  @Operation(summary = "Refresh auth session", description = "Refreshes the access token using the refresh-token cookie.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "Session refreshed",
          content = @Content(schema = @Schema(implementation = AuthSessionResponse.class))),
      @APIResponse(responseCode = "403", description = "Refresh rejected",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response refresh(
      @CookieParam(AuthCookieBuilder.REFRESH_TOKEN_COOKIE) String refreshToken,
      @CookieParam(AuthCookieBuilder.CSRF_TOKEN_COOKIE) String csrfToken
  ) {
    enforceIpLimit("auth:refresh", 20, 60L);
    var session = refreshSessionService.refresh(refreshToken);
    serviceMetricsInstrumentation.record(ServiceMetric.AUTH_REFRESH_SUCCESS);
    return Response.ok(new AuthSessionResponse(session.user().id(), session.user().email()))
        .cookie(authCookieBuilder.accessToken(session.accessToken(), session.expiresIn()))
        .cookie(authCookieBuilder.refreshToken(session.refreshToken(), authCookieBuilder.refreshTokenMaxAgeSeconds()))
        .cookie(authCookieBuilder.csrfToken(csrfToken, authCookieBuilder.refreshTokenMaxAgeSeconds()))
        .build();
  }

  @POST
  @Path("/logout")
  @Operation(summary = "Logout current session", description = "Revokes the refresh token and clears all auth cookies.")
  @APIResponses({
      @APIResponse(responseCode = "204", description = "Session cleared")
  })
  public Response logout(@CookieParam(AuthCookieBuilder.REFRESH_TOKEN_COOKIE) String refreshToken) {
    enforceIpLimit("auth:logout", 20, 60L);
    refreshSessionService.revoke(refreshToken);
    return Response.noContent()
        .cookie(authCookieBuilder.expiredAccessToken())
        .cookie(authCookieBuilder.expiredRefreshToken())
        .cookie(authCookieBuilder.expiredCsrfToken())
        .build();
  }

  @RequireAuth
  @GET
  @Path("/session")
  @Operation(summary = "Get current auth session", description = "Returns the authenticated user resolved from the request auth context.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "Authenticated session",
          content = @Content(schema = @Schema(implementation = AuthSessionResponse.class))),
      @APIResponse(responseCode = "403", description = "Authentication required",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response session() {
    var user = currentUserContext.requireUser();
    return Response.ok(new AuthSessionResponse(user.id(), user.email())).build();
  }

  private void enforceIpLimit(String operation, int limit, long windowSeconds) {
    authRateLimitService.checkIp(operation, clientIp(), limit, windowSeconds);
  }

  private String clientIp() {
    return ClientIpResolver.resolve(headers);
  }
}
