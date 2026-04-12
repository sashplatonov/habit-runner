package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.api.ApiResponses;
import com.sashplatonov.habbit.runner.auth.dto.LoginRequest;
import com.sashplatonov.habbit.runner.auth.dto.RefreshRequest;
import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.auth.dto.UpdatePreferencesRequest;
import com.sashplatonov.habbit.runner.auth.dto.UserPreferencesResponse;
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
  final PreferencesService preferencesService;
  final CurrentUserContext currentUserContext;

  public AuthResource(AuthService authService, PreferencesService preferencesService, CurrentUserContext currentUserContext) {
    this.authService = authService;
    this.preferencesService = preferencesService;
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
    return ApiResponses.redirect(redirect);
  }

  @GET
  @Path("/google/callback")
  public Response googleCallback(@QueryParam("code") String code, @QueryParam("state") String state) {
    var redirect = authService.handleOAuthCallback(code, state);
    return ApiResponses.redirect(redirect);
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
    return ApiResponses.noContent();
  }

  @RequireAuth
  @GET
  @Path("/preferences")
  public UserPreferencesResponse getPreferences() {
    return preferencesService.getUserPreferences(currentUserContext.requireUser().id());
  }

  @RequireAuth
  @PUT
  @Path("/preferences")
  public UserPreferencesResponse updatePreferences(@Valid UpdatePreferencesRequest request) {
    return preferencesService.updateUserPreferences(currentUserContext.requireUser().id(), request);
  }


}
