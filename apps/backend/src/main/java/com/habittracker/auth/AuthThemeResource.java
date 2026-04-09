package com.habittracker.auth;

import com.habittracker.auth.dto.ThemeResponse;
import com.habittracker.auth.dto.UpdatePreferencesRequest;
import com.habittracker.auth.dto.UpdateThemeRequest;
import jakarta.validation.Valid;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/auth/theme")
@Produces(MediaType.APPLICATION_JSON)
public class AuthThemeResource {
  private final PreferencesService preferencesService;
  private final CurrentUserContext currentUserContext;

  public AuthThemeResource(PreferencesService preferencesService, CurrentUserContext currentUserContext) {
    this.preferencesService = preferencesService;
    this.currentUserContext = currentUserContext;
  }

  @RequireAuth
  @GET
  public ThemeResponse getTheme() {
    var prefs = preferencesService.getUserPreferences(currentUserContext.requireUser().id());
    return new ThemeResponse(prefs.theme());
  }

  @RequireAuth
  @PUT
  public ThemeResponse updateTheme(@Valid UpdateThemeRequest request) {
    var prefs = preferencesService.updateUserPreferences(
        currentUserContext.requireUser().id(),
        new UpdatePreferencesRequest(request.theme(), null)
    );
    return new ThemeResponse(prefs.theme());
  }
}
