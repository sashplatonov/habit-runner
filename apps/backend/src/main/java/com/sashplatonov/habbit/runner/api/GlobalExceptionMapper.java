package com.sashplatonov.habbit.runner.api;

import jakarta.validation.ValidationException;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Request;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;

@Provider
@Slf4j
public class GlobalExceptionMapper implements ExceptionMapper<Exception> {

  @Context
  UriInfo uriInfo;

  @Context
  Request request;

  @Context
  HttpHeaders headers;

  @Override
  @SuppressWarnings({
      "PMD.CognitiveComplexity",
      "PMD.CyclomaticComplexity",
      "PMD.NPathComplexity",
      "PMD.LawOfDemeter"
  })
  public Response toResponse(Exception exception) {
    if (exception instanceof ValidationException) {
      return serverError(
          "https://habbit-runner.dev/errors/validation",
          "Validation Error",
          Response.Status.BAD_REQUEST,
          messageOrDefault(exception, "Validation failed"),
          "VALIDATION_FAILED",
          false,
          exception
      );
    }
    if (exception instanceof NotAuthorizedException) {
      return serverError(
          "https://habbit-runner.dev/errors/forbidden",
          "Forbidden",
          Response.Status.FORBIDDEN,
          messageOrDefault(exception, "Authentication required"),
          "AUTH_REQUIRED",
          false,
          exception
      );
    }
    if (exception instanceof NotFoundException) {
      return serverError(
          "https://habbit-runner.dev/errors/not-found",
          "Not Found",
          Response.Status.NOT_FOUND,
          messageOrDefault(exception, "Resource not found"),
          "RESOURCE_NOT_FOUND",
          false,
          exception
      );
    }
    if (exception instanceof BadRequestException) {
      return serverError(
          "https://habbit-runner.dev/errors/bad-request",
          "Bad Request",
          Response.Status.BAD_REQUEST,
          messageOrDefault(exception, "Bad request"),
          "BAD_REQUEST",
          false,
          exception
      );
    }
    if (exception instanceof WebApplicationException webApplicationException) {
      var webResponse = webApplicationException.getResponse();
      var status = webResponse == null ? null : webResponse.getStatusInfo();
      var normalizedStatus = status == null ? Response.Status.INTERNAL_SERVER_ERROR : status;
      var statusCode = normalizedStatus.getStatusCode();
      var title = normalizedStatus.getReasonPhrase();
      if (title == null || title.isBlank() || "Unknown code".equalsIgnoreCase(title)) {
        title = statusCode >= 500 ? "Internal Server Error" : "Request Failed";
      }
      var errorCode = statusCode >= 500 ? "REQUEST_FAILED" : "REQUEST_REJECTED";
      return serverError(
          "https://habbit-runner.dev/errors/request-failed",
          title,
          normalizedStatus,
          messageOrDefault(webApplicationException, title),
          errorCode,
          statusCode >= 500,
          webApplicationException
      );
    }
    return serverError(
        "https://habbit-runner.dev/errors/internal-server-error",
        "Internal Server Error",
        Response.Status.INTERNAL_SERVER_ERROR,
        "Internal server error",
        "INTERNAL_SERVER_ERROR",
        true,
        exception
    );
  }

  @SuppressWarnings("PMD.ExcessiveParameterList")
  private Response serverError(
      String type,
      String title,
      Response.StatusType status,
      String detail,
      String errorCode,
      boolean serverFailure,
      Exception exception
  ) {
    if (serverFailure) {
      log.error(
          "event=request_failed method={} path={} clientIp={} traceId={} status={} detail={}",
          requestMethod(),
          requestPath(),
          clientIp(),
          traceId(),
          status.getStatusCode(),
          detail,
          exception
      );
    } else {
      log.warn(
          "event=request_rejected method={} path={} clientIp={} traceId={} status={} detail={}",
          requestMethod(),
          requestPath(),
          clientIp(),
          traceId(),
          status.getStatusCode(),
          detail
      );
    }
    return Response.status(status)
        .type(MediaType.APPLICATION_JSON)
        .entity(new ErrorResponse(type, title, status.getStatusCode(), detail, errorCode))
        .build();
  }

  private String messageOrDefault(Exception exception, String fallback) {
    var message = exception.getMessage();
    if (message == null || message.isBlank() || message.startsWith("HTTP ")) {
      return fallback;
    }
    return message;
  }

  private String requestMethod() {
    return request == null ? "unknown" : request.getMethod();
  }

  private String requestPath() {
    return uriInfo == null ? "unknown" : uriInfo.getPath();
  }

  private String clientIp() {
    if (headers == null) {
      return "unknown";
    }
    var forwardedFor = firstHeader("X-Forwarded-For");
    if (forwardedFor != null) {
      var firstHop = forwardedFor.split(",")[0].trim();
      if (!firstHop.isEmpty()) {
        return firstHop;
      }
    }
    var realIp = firstHeader("X-Real-IP");
    return realIp == null ? "unknown" : realIp;
  }

  private String firstHeader(String name) {
    var value = headers.getHeaderString(name);
    if (value == null || value.isBlank()) {
      return null;
    }
    return value;
  }

  private String traceId() {
    var traceId = MDC.get("traceId");
    return traceId == null || traceId.isBlank() ? "unknown" : traceId;
  }
}