package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.service.OAuthExchangeService;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitService;
import com.sashplatonov.habbit.runner.auth.support.AuthResourceSupport;
import com.sashplatonov.habbit.runner.api.ClientIpResolver;
import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetric;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetricsInstrumentation;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.net.URI;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/auth/google")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Authentication")
public class GoogleOAuthCallbackResource {
  final OAuthExchangeService oauthExchangeService;
  final AuthCookieBuilder authCookieBuilder;
  final AuthRateLimitService authRateLimitService;
  final ServiceMetricsInstrumentation serviceMetricsInstrumentation;
  @Context
  HttpHeaders headers;

  GoogleOAuthCallbackResource(
      OAuthExchangeService oauthExchangeService,
      AuthResourceSupport authResourceSupport,
      ServiceMetricsInstrumentation serviceMetricsInstrumentation
  ) {
    this.oauthExchangeService = oauthExchangeService;
    this.authCookieBuilder = authResourceSupport.cookieBuilder();
    this.authRateLimitService = authResourceSupport.rateLimitService();
    this.serviceMetricsInstrumentation = serviceMetricsInstrumentation;
  }

  @GET
  @Path("/callback")
  @Operation(summary = "Handle Google OAuth callback",
      description = "Completes the OAuth exchange, sets auth cookies, and redirects back to the web app.")
  @APIResponses({
      @APIResponse(responseCode = "302", description = "OAuth callback completed"),
      @APIResponse(responseCode = "400", description = "Invalid callback parameters",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
      @APIResponse(responseCode = "403", description = "OAuth callback rejected",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response googleCallback(@QueryParam("code") String code, @QueryParam("state") String state) {
    enforceIpLimit("auth:google:callback", 20, 60L);
    var callback = oauthExchangeService.exchange(code, state);
    serviceMetricsInstrumentation.record(ServiceMetric.AUTH_LOGIN_SUCCESS_GOOGLE);
    var responseBuilder = Response.status(Response.Status.FOUND)
        .location(URI.create(callback.redirectUrl()));
    var session = callback.session();
    return responseBuilder
        .cookie(authCookieBuilder.accessToken(session.accessToken(), session.expiresIn()))
        .cookie(authCookieBuilder.refreshToken(session.refreshToken(), authCookieBuilder.refreshTokenMaxAgeSeconds()))
        .cookie(authCookieBuilder.csrfToken(null, authCookieBuilder.refreshTokenMaxAgeSeconds()))
        .build();
  }

  private void enforceIpLimit(String operation, int limit, long windowSeconds) {
    authRateLimitService.checkIp(operation, clientIp(), limit, windowSeconds);
  }

  private String clientIp() {
    return ClientIpResolver.resolve(headers);
  }
}
