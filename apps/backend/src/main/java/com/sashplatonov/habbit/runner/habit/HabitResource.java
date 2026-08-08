package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.api.AuthenticatedResourceSupport;
import com.sashplatonov.habbit.runner.api.OperationFailure;
import com.sashplatonov.habbit.runner.api.OperationSuccess;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.habit.dto.HabitCreateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitResponseDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitStatusUpdateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitUpdateRequestDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/habits")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequireAuth
@Tag(name = "Habits")
@Slf4j
public class HabitResource extends AuthenticatedResourceSupport {
  private final HabitService habitService;

  HabitResource(HabitService habitService, CurrentUserContext currentUserContext) {
    super(currentUserContext);
    this.habitService = habitService;
  }

  @GET
  @Operation(summary = "List habits", description = "Returns up to the default page of habits for the authenticated user.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "Habits loaded",
          content = @Content(schema = @Schema(implementation = HabitResponseDto.class))),
      @APIResponse(responseCode = "403", description = "Authentication required",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public List<HabitResponseDto> findAll() {
    return habitService.findAll(currentUserId());
  }


  @POST
  @Operation(summary = "Create habit", description = "Creates or replaces a habit for the authenticated user.")
  @APIResponses({
      @APIResponse(responseCode = "201", description = "Habit created",
          content = @Content(schema = @Schema(implementation = HabitResponseDto.class))),
      @APIResponse(responseCode = "400", description = "Validation failed",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
      @APIResponse(responseCode = "403", description = "Authentication required",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
      @APIResponse(responseCode = "409", description = "Habit id belongs to another user",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response create(@Valid @NotNull HabitCreateRequestDto body) {
    return toResponse(habitService.create(currentUserId(), body), Response.Status.CREATED);
  }

  @PUT
  @Path("/{habitId}")
  @Operation(summary = "Update habit", description = "Updates a habit with a concrete domain-specific request DTO.")
  @APIResponse(responseCode = "200", description = "Habit updated",
      content = @Content(schema = @Schema(implementation = HabitResponseDto.class)))
  @HabitMutationErrorResponses
  public Response update(@PathParam("habitId") String habitId, @Valid @NotNull HabitUpdateRequestDto body) {
    return toResponse(habitService.update(currentUserId(), habitId, body), Response.Status.OK);
  }

  @PATCH
  @Path("/{habitId}/status")
  @Operation(summary = "Update habit status", description = "Toggles the habit archive status using a dedicated request DTO.")
  @APIResponse(responseCode = "200", description = "Habit status updated",
      content = @Content(schema = @Schema(implementation = HabitResponseDto.class)))
  @HabitMutationErrorResponses
  public Response updateStatus(@PathParam("habitId") String habitId, @Valid @NotNull HabitStatusUpdateRequestDto body) {
    return toResponse(habitService.updateStatus(currentUserId(), habitId, body), Response.Status.OK);
  }

  @DELETE
  @Path("/{habitId}")
  @Operation(summary = "Delete habit", description = "Deletes a habit for the authenticated user.")
  @APIResponses({
      @APIResponse(responseCode = "204", description = "Habit deleted"),
      @APIResponse(responseCode = "403", description = "Authentication required",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
      @APIResponse(responseCode = "404", description = "Habit not found",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response delete(@PathParam("habitId") String habitId) {
    var result = habitService.delete(currentUserId(), habitId);
    if (result instanceof OperationSuccess<Void>) {
      return Response.noContent().build();
    }
    var failure = (OperationFailure<Void>) result;
    return Response.status(failure.toErrorResponse().status()).entity(failure.toErrorResponse()).build();
  }
}
