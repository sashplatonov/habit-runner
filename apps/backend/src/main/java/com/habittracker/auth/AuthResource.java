package com.habittracker.auth;

import com.habittracker.auth.dto.LoginRequest;
import com.habittracker.auth.dto.RefreshRequest;
import com.habittracker.auth.dto.TokenResponse;
import com.habittracker.auth.dto.UpdatePreferencesRequest;
import com.habittracker.auth.dto.UpdateThemeRequest;
import com.habittracker.auth.dto.UserPreferencesResponse;
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
  public TokenResponse login(@Valid LoginRequest request) {
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
  public TokenResponse refresh(@Valid RefreshRequest request) {
    return authService.refreshToken(request.refreshToken());
  }

  @POST
  @Path("/logout")
  public Response logout(@Valid RefreshRequest request) {
    authService.revokeToken(request.refreshToken());
    return Response.noContent().build();
  }

  @RequireAuth
  @GET
  @Path("/preferences")
  public UserPreferencesResponse getPreferences() {
    return authService.getUserPreferences(currentUserContext.requireUser().id());
  }

  @RequireAuth
  @PUT
  @Path("/preferences")
  public UserPreferencesResponse updatePreferences(@Valid UpdatePreferencesRequest request) {
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
  public java.util.Map<String, String> updateTheme(@Valid UpdateThemeRequest request) {
    var prefs = authService.updateUserPreferences(
        currentUserContext.requireUser().id(),
        new UpdatePreferencesRequest(request.theme(), null)
    );
    return java.util.Map.of("theme", prefs.theme());
  }
}
