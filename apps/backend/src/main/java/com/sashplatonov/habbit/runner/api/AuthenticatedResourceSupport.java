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
    if (result instanceof OperationSuccess<T> success) {
      return Response.status(status).entity(success.value()).build();
    }
    var failure = (OperationFailure<T>) result;
    var error = failure.toErrorResponse();
    return Response.status(error.status()).entity(error).build();
  }
}
