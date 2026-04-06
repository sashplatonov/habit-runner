package com.habittracker.auth;

import jakarta.validation.Valid;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {
  final AuthService authService;
  final CurrentUserContext currentUserContext;

  public AuthResource(AuthService authService, CurrentUserContext currentUserContext) {
    this.authService = authService;
    this.currentUserContext = currentUserContext;
  }

  @POST
  @Path("/login")
  public AuthDtos.TokenResponse login(@Valid AuthDtos.LoginRequest request) {
    return authService.login(request.email());
  }

  @GET
  @Path("/google/start")
  public Response startGoogle(@QueryParam("returnTo") String returnTo) {
    var redirect = authService.createOAuthAuthorizationUrl(returnTo);
    return Response.status(Response.Status.FOUND).location(java.net.URI.create(redirect)).build();
  }

  @GET
  @Path("/google/callback")
  public Response googleCallback(@QueryParam("code") String code, @QueryParam("state") String state) {
    var redirect = authService.handleOAuthCallback(code, state);
    return Response.status(Response.Status.FOUND).location(java.net.URI.create(redirect)).build();
  }

  @POST
  @Path("/refresh")
  public AuthDtos.TokenResponse refresh(@Valid AuthDtos.RefreshRequest request) {
    return authService.refreshToken(request.refreshToken());
  }

  @POST
  @Path("/logout")
  public Response logout(@Valid AuthDtos.RefreshRequest request) {
    authService.revokeToken(request.refreshToken());
    return Response.noContent().build();
  }

  @RequireAuth
  @GET
  @Path("/preferences")
  public AuthDtos.UserPreferencesResponse getPreferences() {
    return authService.getUserPreferences(currentUserContext.requireUser().id());
  }

  @RequireAuth
  @PUT
  @Path("/preferences")
  public AuthDtos.UserPreferencesResponse updatePreferences(@Valid AuthDtos.UpdatePreferencesRequest request) {
    return authService.updateUserPreferences(currentUserContext.requireUser().id(), request);
  }

  @RequireAuth
  @GET
  @Path("/theme")
  public java.util.Map<String, String> getTheme() {
    var prefs = authService.getUserPreferences(currentUserContext.requireUser().id());
    return java.util.Map.of("theme", prefs.theme());
  }

  @RequireAuth
  @PUT
  @Path("/theme")
  public java.util.Map<String, String> updateTheme(@Valid AuthDtos.UpdateThemeRequest request) {
    var theme = authService.updateUserTheme(currentUserContext.requireUser().id(), request.theme());
    return java.util.Map.of("theme", theme);
  }
}
