package com.sashplatonov.habbit.runner.api;

import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.RefreshTokenRejectedException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import lombok.extern.slf4j.Slf4j;

@Provider
@Slf4j
public class RefreshTokenRejectedExceptionMapper implements ExceptionMapper<RefreshTokenRejectedException> {
  private static final String ERROR_TYPE = "https://habbit-runner.dev/errors/forbidden";
  private final AuthCookieBuilder authCookieBuilder;

  public RefreshTokenRejectedExceptionMapper(AuthCookieBuilder authCookieBuilder) {
    this.authCookieBuilder = authCookieBuilder;
  }

  @Override
  public Response toResponse(RefreshTokenRejectedException exception) {
    var error = new ErrorResponse(
        ERROR_TYPE,
        "Forbidden",
        Response.Status.FORBIDDEN.getStatusCode(),
        "Authentication required",
        "AUTH_REQUIRED"
    );
    log.warn(
        "event=refresh_token_rejected traceId={} reason=expired-revoked-or-reused",
        ExceptionResponseSupport.traceId()
    );
    return Response.status(error.status())
        .type(MediaType.APPLICATION_JSON)
        .cookie(authCookieBuilder.expiredAccessToken())
        .cookie(authCookieBuilder.expiredRefreshToken())
        .cookie(authCookieBuilder.expiredCsrfToken())
        .entity(error)
        .build();
  }
}
