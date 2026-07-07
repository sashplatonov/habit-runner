package com.sashplatonov.habbit.runner.checkin;

import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.api.OperationFailure;
import com.sashplatonov.habbit.runner.api.OperationResult;
import com.sashplatonov.habbit.runner.api.OperationSuccess;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.checkin.dto.CheckinResponseDto;
import com.sashplatonov.habbit.runner.checkin.dto.CheckinUpsertRequestDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/checkins")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequireAuth
@Tag(name = "Checkins")
public class CheckinResource {
  private final CheckinService checkinService;
  private final CurrentUserContext currentUserContext;

  public CheckinResource(CheckinService checkinService, CurrentUserContext currentUserContext) {
    this.checkinService = checkinService;
    this.currentUserContext = currentUserContext;
  }

  @GET
  @Operation(summary = "List checkins", description = "Returns all checkins for the authenticated user.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "Checkins loaded",
          content = @Content(schema = @Schema(implementation = CheckinResponseDto.class))),
      @APIResponse(responseCode = "403", description = "Authentication required",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public List<CheckinResponseDto> findAll() {
    var userId = currentUserContext.requireUser().id();
    return checkinService.findAll(userId);
  }

  @PUT
  @Path("/habits/{habitId}/dates/{date}")
  @Operation(summary = "Upsert checkin", description = "Creates or updates a checkin for a concrete habit and date.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "Checkin upserted",
          content = @Content(schema = @Schema(implementation = CheckinResponseDto.class))),
      @APIResponse(responseCode = "400", description = "Validation failed",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
      @APIResponse(responseCode = "404", description = "Habit or checkin not found",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response upsert(
      @PathParam("habitId") String habitId,
      @PathParam("date") String date,
      @Valid @NotNull CheckinUpsertRequestDto body
  ) {
    var userId = currentUserContext.requireUser().id();
    return toResponse(checkinService.upsert(userId, habitId, date, body), Response.Status.OK);
  }

  @DELETE
  @Path("/habits/{habitId}/dates/{date}")
  @Operation(summary = "Delete checkin", description = "Deletes a checkin for a concrete habit and date.")
  @APIResponses({
      @APIResponse(responseCode = "204", description = "Checkin deleted"),
      @APIResponse(responseCode = "400", description = "Validation failed",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
      @APIResponse(responseCode = "404", description = "Habit or checkin not found",
          content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public Response delete(@PathParam("habitId") String habitId, @PathParam("date") String date) {
    var userId = currentUserContext.requireUser().id();
    var result = checkinService.delete(userId, habitId, date);
    if (result instanceof OperationSuccess<Void>) {
      return Response.noContent().build();
    }
    var failure = (OperationFailure<Void>) result;
    return Response.status(failure.toErrorResponse().status()).entity(failure.toErrorResponse()).build();
  }

  private <T> Response toResponse(OperationResult<T> result, Response.Status status) {
    if (result instanceof OperationSuccess<T> success) {
      return Response.status(status).entity(success.value()).build();
    }
    var failure = (OperationFailure<T>) result;
    var error = failure.toErrorResponse();
    return Response.status(error.status()).entity(error).build();
  }
}
