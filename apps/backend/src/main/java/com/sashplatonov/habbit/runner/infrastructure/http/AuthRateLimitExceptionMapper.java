package com.sashplatonov.habbit.runner.api;

import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import lombok.extern.slf4j.Slf4j;

@Provider
@Slf4j
public class AuthRateLimitExceptionMapper implements ExceptionMapper<AuthRateLimitException> {
  private static final String ERR_BASE = "https://habbit-runner.dev/errors/";

  @Override
  public Response toResponse(AuthRateLimitException exception) {
    var error = new ErrorResponse(
        ERR_BASE + "rate-limit",
        "Too Many Requests",
        Response.Status.TOO_MANY_REQUESTS.getStatusCode(),
        "Authentication rate limit exceeded",
        "AUTH_RATE_LIMITED"
    );
    log.warn(
        "event=request_rejected status={} detail={} retryAfterSeconds={}",
        error.status(),
        error.detail(),
        exception.retryAfterSeconds()
    );
    return Response.status(error.status())
        .type(MediaType.APPLICATION_JSON)
        .header("Retry-After", exception.retryAfterSeconds())
        .entity(error)
        .build();
  }
}
