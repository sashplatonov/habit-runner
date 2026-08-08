package com.sashplatonov.habbit.runner.api;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Request;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.util.regex.Pattern;
import org.slf4j.MDC;

final class ExceptionResponseSupport {
  private static final Pattern HTTP_STATUS_MESSAGE = Pattern.compile("^HTTP\\s+(\\d{3})\\b");

  private ExceptionResponseSupport() {
  }

  static Response response(ErrorResponse error) {
    return Response.status(error.status())
        .type(MediaType.APPLICATION_JSON)
        .entity(error)
        .build();
  }

  static String messageOrDefault(Exception exception, String fallback) {
    var message = exception.getMessage();
    if (message == null || message.isBlank() || message.startsWith("HTTP ")) {
      return fallback;
    }
    return message;
  }

  static String requestMethod(Request request) {
    return request == null ? "unknown" : request.getMethod();
  }

  static String requestPath(UriInfo uriInfo) {
    return uriInfo == null ? "unknown" : uriInfo.getPath();
  }

  static String clientIp(HttpHeaders headers) {
    return ClientIpResolver.resolve(headers);
  }

  static String traceId() {
    var traceId = MDC.get("traceId");
    return traceId == null || traceId.isBlank() ? "unknown" : traceId;
  }

  static Response.StatusType normalizedStatus(WebApplicationException exception) {
    var message = exception.getMessage();
    if (message != null) {
      var matcher = HTTP_STATUS_MESSAGE.matcher(message);
      if (matcher.find()) {
        return normalizedStatus(Integer.parseInt(matcher.group(1)));
      }
    }
    return Response.Status.INTERNAL_SERVER_ERROR;
  }

  static Response.StatusType normalizedStatus(int statusCode) {
    var status = Response.Status.fromStatusCode(statusCode);
    if (status != null) {
      return status;
    }
    return new UnknownStatus(statusCode);
  }

  static String title(Response.StatusType status) {
    var reason = status.getReasonPhrase();
    if (reason == null || reason.isBlank() || "Unknown code".equalsIgnoreCase(reason)) {
      return status.getStatusCode() >= 500 ? "Internal Server Error" : "Request Failed";
    }
    return reason;
  }

  static boolean isServerFailure(Response.StatusType status) {
    return status.getStatusCode() >= 500;
  }
}
