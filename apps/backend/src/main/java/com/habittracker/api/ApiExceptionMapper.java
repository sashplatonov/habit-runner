package com.habittracker.api;

import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.stream.Collectors;

@Provider
public class ApiExceptionMapper implements ExceptionMapper<Exception> {
  private static final Logger LOG = Logger.getLogger(ApiExceptionMapper.class);

  @Override
  public Response toResponse(Exception exception) {
    return switch (exception) {
      case ConstraintViolationException validationException -> response(
          Response.Status.BAD_REQUEST,
          validationMessage(validationException)
      );
      case NotAuthorizedException notAuthorizedException -> response(
          Response.Status.UNAUTHORIZED,
          messageOrDefault(notAuthorizedException, "Unauthorized")
      );
      case NotFoundException notFoundException -> response(
          Response.Status.NOT_FOUND,
          messageOrDefault(notFoundException, "Not found")
      );
      case BadRequestException badRequestException -> response(
          Response.Status.BAD_REQUEST,
          messageOrDefault(badRequestException, "Bad request")
      );
      case WebApplicationException webApplicationException -> {
        var response = webApplicationException.getResponse();
        var status = response.getStatusInfo();
        yield response(status, messageOrDefault(webApplicationException, "Request failed"));
      }
      default -> {
        LOG.error("Unhandled request failure", exception);
        yield response(Response.Status.INTERNAL_SERVER_ERROR, "Internal server error");
      }
    };
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
}