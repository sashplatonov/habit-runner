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
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;

@Provider
@Slf4j
public class GlobalExceptionMapper implements ExceptionMapper<Exception> {
  private static final Pattern HTTP_STATUS_MESSAGE = Pattern.compile("^HTTP\\s+(\\d{3})\\b");

  @Context
  UriInfo uriInfo;

  @Context
  Request request;

  @Context
  HttpHeaders headers;

  private static final String ERR_BASE = "https://habbit-runner.dev/errors/";

  @Override
  public Response toResponse(Exception exception) {
    return switch (exception) {
      case ValidationException e -> serverError(new ErrorResponse(
        ERR_BASE + "validation",
        "Validation Error",
        Response.Status.BAD_REQUEST.getStatusCode(),
        messageOrDefault(e, "Validation failed"),
        "VALIDATION_FAILED"
      ), false, e);
      case NotAuthorizedException e -> serverError(new ErrorResponse(
        ERR_BASE + "forbidden",
        "Forbidden",
        Response.Status.FORBIDDEN.getStatusCode(),
        messageOrDefault(e, "Authentication required"),
        "AUTH_REQUIRED"
      ), false, e);
      case NotFoundException e -> serverError(new ErrorResponse(
        ERR_BASE + "not-found",
        "Not Found",
        Response.Status.NOT_FOUND.getStatusCode(),
        messageOrDefault(e, "Resource not found"),
        "RESOURCE_NOT_FOUND"
      ), false, e);
      case BadRequestException e -> serverError(new ErrorResponse(
        ERR_BASE + "bad-request",
        "Bad Request",
        Response.Status.BAD_REQUEST.getStatusCode(),
        messageOrDefault(e, "Bad request"),
        "BAD_REQUEST"
      ), false, e);
      case WebApplicationException e -> webException(e);
      default -> serverError(new ErrorResponse(
        ERR_BASE + "internal-server-error",
        "Internal Server Error",
        Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(),
        "Internal server error",
        "INTERNAL_SERVER_ERROR"
      ), true, exception);
    };
  }

  private Response webException(WebApplicationException e) {
    var status = normalizedStatus(e);
    var title = title(status);
    return serverError(
        new ErrorResponse(
            ERR_BASE + "request-failed",
            title,
            status.getStatusCode(),
            messageOrDefault(e, title),
            status.getStatusCode() >= 500 ? "REQUEST_FAILED" : "REQUEST_REJECTED"
        ),
        isServerFailure(status),
        e
    );
  }

  private static Response.StatusType normalizedStatus(WebApplicationException exception) {
    var message = exception.getMessage();
    if (message != null) {
      var matcher = HTTP_STATUS_MESSAGE.matcher(message);
      if (matcher.find()) {
        return normalizedStatus(Integer.parseInt(matcher.group(1)));
      }
    }
    return Response.Status.INTERNAL_SERVER_ERROR;
  }

  private Response serverError(ErrorResponse error, boolean serverFailure, Exception exception) {
    if (serverFailure) {
      log.error(
          "event=request_failed method={} path={} clientIp={} traceId={} status={} detail={}",
          requestMethod(),
          requestPath(),
          clientIp(),
          traceId(),
          error.status(),
          error.detail(),
          exception
      );
    } else {
      log.warn(
          "event=request_rejected method={} path={} clientIp={} traceId={} status={} detail={}",
          requestMethod(),
          requestPath(),
          clientIp(),
          traceId(),
          error.status(),
          error.detail()
      );
    }
    return Response.status(error.status())
        .type(MediaType.APPLICATION_JSON)
        .entity(error)
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

  private static boolean isServerFailure(Response.StatusType status) {
    return status.getStatusCode() >= 500;
  }

  private static Response.StatusType normalizedStatus(int statusCode) {
    var status = Response.Status.fromStatusCode(statusCode);
    if (status != null) {
      return status;
    }
    return new UnknownStatus(statusCode);
  }

  private static String title(Response.StatusType status) {
    var reason = status.getReasonPhrase();
    if (reason == null || reason.isBlank() || "Unknown code".equalsIgnoreCase(reason)) {
      return status.getStatusCode() >= 500 ? "Internal Server Error" : "Request Failed";
    }
    return reason;
  }
}
