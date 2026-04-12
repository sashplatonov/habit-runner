package com.sashplatonov.habbit.runner.api;

import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;

import java.util.stream.Collectors;

@Provider
@Slf4j
public class ConstraintViolationExceptionMapper implements ExceptionMapper<ConstraintViolationException> {

  private static final String VALIDATION_TYPE = "https://habbit-runner.dev/errors/validation";
  private static final String VALIDATION_TITLE = "Constraint Violation";
  private static final String VALIDATION_ERROR_CODE = "VALIDATION_FAILED";

  @Override
  public Response toResponse(ConstraintViolationException exception) {
    var detail = exception.getConstraintViolations().stream()
        .map(violation -> violation.getPropertyPath() + " " + violation.getMessage())
        .sorted()
        .collect(Collectors.joining("; "));
    var normalizedDetail = detail.isBlank() ? "Validation failed" : detail;
    log.warn(
        "event=request_validation_failed traceId={} detail={}",
        traceId(),
        normalizedDetail
    );
    return Response.status(Response.Status.BAD_REQUEST)
        .type(MediaType.APPLICATION_JSON)
        .entity(new ErrorResponse(
            VALIDATION_TYPE,
            VALIDATION_TITLE,
            Response.Status.BAD_REQUEST.getStatusCode(),
            normalizedDetail,
            VALIDATION_ERROR_CODE
        ))
        .build();
  }

  private String traceId() {
    var traceId = MDC.get("traceId");
    return traceId == null || traceId.isBlank() ? "unknown" : traceId;
  }
}