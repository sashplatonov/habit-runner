package com.sashplatonov.habbit.runner.api;

import jakarta.validation.ValidationException;
import jakarta.persistence.OptimisticLockException;
import jakarta.persistence.PersistenceException;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Request;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Exception> {
  @Context
  UriInfo uriInfo;

  @Context
  Request request;

  @Context
  HttpHeaders headers;

  @Override
  public Response toResponse(Exception exception) {
    return switch (exception) {
      case ValidationException e -> validationResponse(e);
      case OptimisticLockException ignored -> conflictResponse("The resource was changed by another request", "RESOURCE_VERSION_CONFLICT");
      case PersistenceException ignored -> conflictResponse("The request conflicts with existing data", "RESOURCE_CONFLICT");
      case NotAuthorizedException e -> notAuthorizedResponse(e);
      case ForbiddenException e -> forbiddenResponse(e);
      case NotFoundException e -> notFoundResponse(e);
      case BadRequestException e -> badRequestResponse(e);
      case WebApplicationException e -> webApplicationResponse(e);
      default -> internalServerErrorResponse(exception);
    };
  }

  private Response validationResponse(ValidationException exception) {
    var ctx = ExceptionResponseSupport.context(request, uriInfo, headers);
    var error = ExceptionResponseSupport.error(new ErrorSpec("validation", "Validation Error",
        Response.Status.BAD_REQUEST.getStatusCode(),
        ExceptionResponseSupport.messageOrDefault(exception, "Validation failed"),
        "VALIDATION_FAILED"));
    return ExceptionResponseSupport.rejected(ctx, false, error);
  }

  private Response conflictResponse(String detail, String code) {
    var ctx = ExceptionResponseSupport.context(request, uriInfo, headers);
    var error = ExceptionResponseSupport.error(new ErrorSpec("conflict", "Conflict",
        Response.Status.CONFLICT.getStatusCode(), detail, code));
    return ExceptionResponseSupport.rejected(ctx, false, error);
  }

  private Response notAuthorizedResponse(NotAuthorizedException exception) {
    var ctx = ExceptionResponseSupport.context(request, uriInfo, headers);
    var error = ExceptionResponseSupport.error(new ErrorSpec("forbidden", "Forbidden",
        Response.Status.FORBIDDEN.getStatusCode(),
        ExceptionResponseSupport.messageOrDefault(exception, "Authentication required"),
        "AUTH_REQUIRED"));
    return ExceptionResponseSupport.rejected(ctx, false, error);
  }

  private Response forbiddenResponse(ForbiddenException exception) {
    var ctx = ExceptionResponseSupport.context(request, uriInfo, headers);
    var error = ExceptionResponseSupport.error(new ErrorSpec("forbidden", "Forbidden",
        Response.Status.FORBIDDEN.getStatusCode(),
        ExceptionResponseSupport.messageOrDefault(exception, "Request forbidden"),
        "REQUEST_REJECTED"));
    return ExceptionResponseSupport.rejected(ctx, true, error);
  }

  private Response notFoundResponse(NotFoundException exception) {
    var ctx = ExceptionResponseSupport.context(request, uriInfo, headers);
    var error = ExceptionResponseSupport.error(new ErrorSpec("not-found", "Not Found",
        Response.Status.NOT_FOUND.getStatusCode(),
        ExceptionResponseSupport.messageOrDefault(exception, "Resource not found"),
        "RESOURCE_NOT_FOUND"));
    return ExceptionResponseSupport.rejected(ctx, false, error);
  }

  private Response badRequestResponse(BadRequestException exception) {
    var ctx = ExceptionResponseSupport.context(request, uriInfo, headers);
    var error = ExceptionResponseSupport.error(new ErrorSpec("bad-request", "Bad Request",
        Response.Status.BAD_REQUEST.getStatusCode(),
        ExceptionResponseSupport.messageOrDefault(exception, "Bad request"),
        "BAD_REQUEST"));
    return ExceptionResponseSupport.rejected(ctx, false, error);
  }

  private Response webApplicationResponse(WebApplicationException exception) {
    var ctx = ExceptionResponseSupport.context(request, uriInfo, headers);
    var status = ExceptionResponseSupport.normalizedStatus(exception);
    var title = ExceptionResponseSupport.title(status);
    var code = status.getStatusCode() >= 500 ? "REQUEST_FAILED" : "REQUEST_REJECTED";
    var error = ExceptionResponseSupport.error(new ErrorSpec("request-failed", title, status.getStatusCode(),
        ExceptionResponseSupport.messageOrDefault(exception, title), code));
    if (ExceptionResponseSupport.isServerFailure(status)) {
      return ExceptionResponseSupport.failed(ctx, error, exception);
    }
    return ExceptionResponseSupport.rejected(ctx, false, error);
  }

  private Response internalServerErrorResponse(Exception exception) {
    var ctx = ExceptionResponseSupport.context(request, uriInfo, headers);
    var error = ExceptionResponseSupport.error(new ErrorSpec("internal-server-error", "Internal Server Error",
        Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(), "Internal server error",
        "INTERNAL_SERVER_ERROR"));
    return ExceptionResponseSupport.failed(ctx, error, exception);
  }
}
