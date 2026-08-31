package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.auth.service.OAuthAuthorizationService;
import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitService;
import com.sashplatonov.habbit.runner.auth.support.AuthResourceSupport;
import com.sashplatonov.habbit.runner.api.ApiResponses;
import com.sashplatonov.habbit.runner.api.ClientIpResolver;
import com.sashplatonov.habbit.runner.api.ErrorResponse;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/auth/google")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Authentication")
public class GoogleOAuthStartResource {
  final OAuthAuthorizationService oauthAuthorizationService;
  final AuthRateLimitService authRateLimitService;
  final CurrentUserContext currentUserContext;
  @Context
  HttpHeaders headers;

  GoogleOAuthStartResource(
      OAuthAuthorizationService oauthAuthorizationService,
      AuthResourceSupport authResourceSupport,
      CurrentUserContext currentUserContext
  ) {
    this.oauthAuthorizationService = oauthAuthorizationService;
    this.authRateLimitService = authResourceSupport.rateLimitService();
    this.currentUserContext = currentUserContext;
  }

  @GET
  @Path("/start")
  @Operation(summary = "Start Google OAuth", description = "Redirects the browser to Google OAuth authorization.")
  @APIResponses({
      @APIResponse(responseCode = "302", description = "OAuth redirect initiated")
  })
  public Response startGoogle(@QueryParam("returnTo") String returnTo) {
    enforceIpLimit("auth:google:start", 30, 60L);
    var redirect = oauthAuthorizationService.createAuthorizationUrl(returnTo);
    return ApiResponses.redirect(redirect);
  }

  @RequireAuth
  @GET
  @Path("/link/start")
  @Operation(summary = "Start Google account linking",
      description = "Starts Google OAuth to attach a Google email to the authenticated account.")
  @APIResponses({
      @APIResponse(responseCode = "302", description = "OAuth redirect initiated"),
      @APIResponse(responseCode = "403", description = "Authentication required",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response startGoogleLink(@QueryParam("returnTo") String returnTo) {
    enforceIpLimit("auth:google:link:start", 30, 60L);
    var owner = currentUserContext.requireUser();
    var redirect = oauthAuthorizationService.createLinkAuthorizationUrl(owner.id(), returnTo);
    return ApiResponses.redirect(redirect);
  }

  private void enforceIpLimit(String operation, int limit, long windowSeconds) {
    authRateLimitService.checkIp(operation, clientIp(), limit, windowSeconds);
  }

  private String clientIp() {
    return ClientIpResolver.resolve(headers);
  }
}
