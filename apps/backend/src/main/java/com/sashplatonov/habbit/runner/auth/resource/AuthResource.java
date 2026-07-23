package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.auth.service.AuthService;
import com.sashplatonov.habbit.runner.auth.service.PreferencesService;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthSupport;
import com.sashplatonov.habbit.runner.api.ApiResponses;
import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.auth.dto.AuthSessionResponse;
import com.sashplatonov.habbit.runner.auth.dto.LoginRequest;
import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.auth.dto.UpdatePreferencesRequest;
import com.sashplatonov.habbit.runner.auth.dto.UserPreferencesResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
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
public class AuthResource {
  final AuthService authService;
  final PreferencesService preferencesService;
  final CurrentUserContext currentUserContext;
  final AuthCookieBuilder authCookieBuilder;

  public AuthResource(
      AuthService authService,
      PreferencesService preferencesService,
      CurrentUserContext currentUserContext,
      AuthCookieBuilder authCookieBuilder
  ) {
    this.authService = authService;
    this.preferencesService = preferencesService;
    this.currentUserContext = currentUserContext;
    this.authCookieBuilder = authCookieBuilder;
  }

  @POST
  @Path("/login")
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Create login session", description = "Authenticates the user and issues auth cookies.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "Authenticated session",
          content = @Content(schema = @Schema(implementation = AuthSessionResponse.class))),
      @APIResponse(responseCode = "400", description = "Validation failed",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
      @APIResponse(responseCode = "403", description = "Authentication rejected",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response login(@Valid @NotNull LoginRequest request) {
    var session = authService.login(request.email());
    return authenticatedSessionResponse(session, null);
  }

  @GET
  @Path("/google/start")
  @Operation(summary = "Start Google OAuth", description = "Redirects the browser to Google OAuth authorization.")
  @APIResponses({
      @APIResponse(responseCode = "302", description = "OAuth redirect initiated")
  })
  public Response startGoogle(@QueryParam("returnTo") String returnTo) {
    var redirect = authService.createOAuthAuthorizationUrl(returnTo);
    return ApiResponses.redirect(redirect);
  }

  @GET
  @Path("/google/callback")
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
    var callback = authService.handleOAuthCallbackSession(code, state);
    var responseBuilder = Response.status(Response.Status.FOUND)
        .location(java.net.URI.create(callback.redirectUrl()));
    return addSessionCookies(responseBuilder, callback.session(), null).build();
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
    var session = authService.refreshToken(refreshToken);
    return authenticatedSessionResponse(session, csrfToken);
  }

  @POST
  @Path("/logout")
  @Operation(summary = "Logout current session", description = "Revokes the refresh token and clears all auth cookies.")
  @APIResponses({
      @APIResponse(responseCode = "204", description = "Session cleared")
  })
  public Response logout(@CookieParam(AuthCookieBuilder.REFRESH_TOKEN_COOKIE) String refreshToken) {
    authService.revokeToken(refreshToken);
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

  @RequireAuth
  @GET
  @Path("/preferences")
  @Operation(summary = "Get user preferences", description = "Returns the stored preferences for the authenticated user.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "User preferences",
          content = @Content(schema = @Schema(implementation = UserPreferencesResponse.class))),
      @APIResponse(responseCode = "403", description = "Authentication required",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response getPreferences() {
    return Response.ok(preferencesService.getUserPreferences(currentUserContext.requireUser().id())).build();
  }

  @RequireAuth
  @PUT
  @Path("/preferences")
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Update user preferences", description = "Updates the stored preferences for the authenticated user.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "User preferences updated",
          content = @Content(schema = @Schema(implementation = UserPreferencesResponse.class))),
      @APIResponse(responseCode = "400", description = "Validation failed",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
      @APIResponse(responseCode = "403", description = "Authentication required",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response updatePreferences(@Valid @NotNull UpdatePreferencesRequest request) {
    var updated = preferencesService.updateUserPreferences(
        currentUserContext.requireUser().id(), request);
    return Response.ok(updated).build();
  }

  private Response authenticatedSessionResponse(TokenResponse session, String csrfToken) {
    var responseBuilder = Response.ok(currentSessionResponse(session));
    return addSessionCookies(responseBuilder, session, csrfToken).build();
  }

  private Response.ResponseBuilder addSessionCookies(
      Response.ResponseBuilder responseBuilder,
      TokenResponse session,
      String existingCsrfToken
  ) {
    var csrfToken = existingCsrfToken == null || existingCsrfToken.isBlank()
        ? AuthSupport.randomToken(16)
        : existingCsrfToken;
    return responseBuilder
        .cookie(authCookieBuilder.accessToken(session.accessToken(), session.expiresIn()))
        .cookie(authCookieBuilder.refreshToken(session.refreshToken(), refreshCookieMaxAgeSeconds()))
        .cookie(authCookieBuilder.csrfToken(csrfToken, refreshCookieMaxAgeSeconds()));
  }

  private AuthSessionResponse currentSessionResponse(TokenResponse session) {
    var user = authService.verifyAccessToken(session.accessToken());
    return new AuthSessionResponse(user.id(), user.email());
  }

  private int refreshCookieMaxAgeSeconds() {
    return authService.refreshTokenDays() * 24 * 60 * 60;
  }
}
