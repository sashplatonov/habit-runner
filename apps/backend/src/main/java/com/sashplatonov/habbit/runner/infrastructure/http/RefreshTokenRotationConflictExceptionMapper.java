package com.sashplatonov.habbit.runner.api;

import com.sashplatonov.habbit.runner.auth.support.RefreshTokenRotationConflictException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class RefreshTokenRotationConflictExceptionMapper
    implements ExceptionMapper<RefreshTokenRotationConflictException> {
  private static final String ERROR_TYPE = "https://habbit-runner.dev/errors/refresh-conflict";

  @Override
  public Response toResponse(RefreshTokenRotationConflictException exception) {
    var error = new ErrorResponse(
        ERROR_TYPE,
        "Conflict",
        Response.Status.CONFLICT.getStatusCode(),
        exception.getMessage(),
        "REFRESH_ROTATION_CONFLICT"
    );
    return ExceptionResponseSupport.response(error);
  }
}
