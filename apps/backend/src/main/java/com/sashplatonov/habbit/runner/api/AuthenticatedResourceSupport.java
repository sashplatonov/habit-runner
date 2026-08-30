package com.sashplatonov.habbit.runner.api;

import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import jakarta.ws.rs.core.Response;

public abstract class AuthenticatedResourceSupport {
  private final CurrentUserContext currentUserContext;

  protected AuthenticatedResourceSupport(CurrentUserContext currentUserContext) {
    this.currentUserContext = currentUserContext;
  }

  protected String currentUserId() {
    return currentUserContext.requireUser().id();
  }

  protected <T> Response toResponse(OperationResult<T> result, Response.Status status) {
    return switch (result) {
      case OperationSuccess<T> success -> Response.status(status).entity(success.value()).build();
      case OperationFailure<T> failure -> errorResponse(failure);
    };
  }

  protected Response toResponse(OperationResult<Void> result) {
    return switch (result) {
      case OperationSuccess<Void> ignored -> Response.noContent().build();
      case OperationFailure<Void> failure -> errorResponse(failure);
    };
  }

  private Response errorResponse(OperationFailure<?> failure) {
    var error = failure.toErrorResponse();
    return Response.status(error.status()).entity(error).build();
  }
}
