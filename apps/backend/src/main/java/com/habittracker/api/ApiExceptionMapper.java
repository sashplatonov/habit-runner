package com.habittracker.api;

import jakarta.validation.ConstraintViolationException;
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

import java.time.Instant;
import java.util.stream.Collectors;

@Provider
@Slf4j
public class ApiExceptionMapper implements ExceptionMapper<Exception> {
  @Context
  UriInfo uriInfo;

  @Context
  Request request;

  @Context
  HttpHeaders headers;

  @Override
  public Response toResponse(Exception exception) {
    return switch (exception) {
      case ConstraintViolationException validationException -> {
        var message = validationMessage(validationException);
        logClientFailure(Response.Status.BAD_REQUEST, message);
        yield response(Response.Status.BAD_REQUEST, message);
      }
      case NotAuthorizedException notAuthorizedException -> {
        var message = messageOrDefault(notAuthorizedException, "Unauthorized");
        logClientFailure(Response.Status.UNAUTHORIZED, message);
        yield response(Response.Status.UNAUTHORIZED, message);
      }
      case NotFoundException notFoundException -> {
        var message = messageOrDefault(notFoundException, "Not found");
        logClientFailure(Response.Status.NOT_FOUND, message);
        yield response(Response.Status.NOT_FOUND, message);
      }
      case BadRequestException badRequestException -> {
        var message = messageOrDefault(badRequestException, "Bad request");
        logClientFailure(Response.Status.BAD_REQUEST, message);
        yield response(Response.Status.BAD_REQUEST, message);
      }
      case WebApplicationException webApplicationException -> {
        var errorResponse = webApplicationException.getResponse();
        var status = errorResponse.getStatusInfo();
        var statusCode = errorResponse.getStatus();
        var message = messageOrDefault(webApplicationException, "Request failed");
        if (statusCode >= 500) {
          logServerFailure(status, message, webApplicationException);
        } else {
          logClientFailure(status, message);
        }
        yield response(status, message);
      }
      default -> {
        logServerFailure(Response.Status.INTERNAL_SERVER_ERROR, "Internal server error", exception);
        yield response(Response.Status.INTERNAL_SERVER_ERROR, "Internal server error");
      }
    };
  }

  private void logClientFailure(Response.StatusType status, String reason) {
    var statusCode = status.getStatusCode();
    log.warn(
        "Request rejected: method={}, path={}, status={}, reason={}, clientIp={}, traceId={}",
        requestMethod(),
        requestPath(),
      statusCode,
        reason,
        clientIp(),
        traceId()
    );
  }

  private void logServerFailure(Response.StatusType status, String reason, Exception exception) {
    var statusCode = status.getStatusCode();
    log.error(
        "Unhandled request failure: method={}, path={}, status={}, reason={}, clientIp={}, traceId={}",
        requestMethod(),
        requestPath(),
      statusCode,
        reason,
        clientIp(),
        traceId(),
        exception
    );
  }

  private Response response(Response.StatusType status, String message) {
    return Response.status(status)
        .type(MediaType.APPLICATION_JSON)
        .entity(new ApiErrorResponse(status.getStatusCode(), message, Instant.now()))
        .build();
  }

  private String validationMessage(ConstraintViolationException exception) {
    var message = exception.getConstraintViolations().stream()
        .map(violation -> violation.getPropertyPath() + " " + violation.getMessage())
        .sorted()
        .collect(Collectors.joining("; "));
    return message.isBlank() ? "Validation failed" : message;
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