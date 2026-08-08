package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.auth.service.PreferencesService;
import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.auth.dto.ThemeResponse;
import com.sashplatonov.habbit.runner.auth.dto.UpdatePreferencesRequest;
import com.sashplatonov.habbit.runner.auth.dto.UpdateThemeRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/auth/theme")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Authentication")
public class AuthThemeResource {
  private final PreferencesService preferencesService;
  private final CurrentUserContext currentUserContext;

  AuthThemeResource(PreferencesService preferencesService, CurrentUserContext currentUserContext) {
    this.preferencesService = preferencesService;
    this.currentUserContext = currentUserContext;
  }

  @RequireAuth
  @GET
  @Operation(summary = "Get current theme", description = "Returns the current theme for the authenticated user.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "Current theme",
          content = @Content(schema = @Schema(implementation = ThemeResponse.class))),
      @APIResponse(responseCode = "403", description = "Authentication required",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response getTheme() {
    var prefs = preferencesService.getUserPreferences(currentUserContext.requireUser().id());
    return Response.ok(new ThemeResponse(prefs.theme())).build();
  }

  @RequireAuth
  @PUT
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Update current theme", description = "Updates the active theme for the authenticated user.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "Theme updated",
          content = @Content(schema = @Schema(implementation = ThemeResponse.class))),
      @APIResponse(responseCode = "400", description = "Validation failed",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
      @APIResponse(responseCode = "403", description = "Authentication required",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response updateTheme(@Valid @NotNull UpdateThemeRequest request) {
    var prefs = preferencesService.updateUserPreferences(
        currentUserContext.requireUser().id(),
        new UpdatePreferencesRequest(request.theme(), null)
    );
    return Response.ok(new ThemeResponse(prefs.theme())).build();
  }
}
