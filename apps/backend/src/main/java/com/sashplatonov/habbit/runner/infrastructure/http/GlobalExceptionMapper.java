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
import lombok.extern.slf4j.Slf4j;

@Provider
@Slf4j
public class GlobalExceptionMapper implements ExceptionMapper<Exception> {
  private static final String ERR_BASE = "https://habbit-runner.dev/errors/";

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
    var error = new ErrorResponse(
        ERR_BASE + "validation",
        "Validation Error",
        Response.Status.BAD_REQUEST.getStatusCode(),
        ExceptionResponseSupport.messageOrDefault(exception, "Validation failed"),
        "VALIDATION_FAILED"
    );
    log.debug(
        "event=request_rejected method={} path={} clientIp={} traceId={} status={} detail={}",
        ExceptionResponseSupport.requestMethod(request),
        ExceptionResponseSupport.requestPath(uriInfo),
        ExceptionResponseSupport.clientIp(headers),
        ExceptionResponseSupport.traceId(),
        error.status(),
        error.detail()
    );
    return ExceptionResponseSupport.response(error);
  }

  private Response conflictResponse(String detail, String code) {
    var error = new ErrorResponse(
        ERR_BASE + "conflict",
        "Conflict",
        Response.Status.CONFLICT.getStatusCode(),
        detail,
        code
    );
    log.debug(
        "event=request_rejected method={} path={} clientIp={} traceId={} status={} detail={}",
        ExceptionResponseSupport.requestMethod(request),
        ExceptionResponseSupport.requestPath(uriInfo),
        ExceptionResponseSupport.clientIp(headers),
        ExceptionResponseSupport.traceId(),
        error.status(),
        error.detail()
    );
    return ExceptionResponseSupport.response(error);
  }

  private Response notAuthorizedResponse(NotAuthorizedException exception) {
    var error = new ErrorResponse(
        ERR_BASE + "forbidden",
        "Forbidden",
        Response.Status.FORBIDDEN.getStatusCode(),
        ExceptionResponseSupport.messageOrDefault(exception, "Authentication required"),
        "AUTH_REQUIRED"
    );
    log.debug(
        "event=request_rejected method={} path={} clientIp={} traceId={} status={} detail={}",
        ExceptionResponseSupport.requestMethod(request),
        ExceptionResponseSupport.requestPath(uriInfo),
        ExceptionResponseSupport.clientIp(headers),
        ExceptionResponseSupport.traceId(),
        error.status(),
        error.detail()
    );
    return ExceptionResponseSupport.response(error);
  }

  private Response forbiddenResponse(ForbiddenException exception) {
    var error = new ErrorResponse(
        ERR_BASE + "forbidden",
        "Forbidden",
        Response.Status.FORBIDDEN.getStatusCode(),
        ExceptionResponseSupport.messageOrDefault(exception, "Request forbidden"),
        "REQUEST_REJECTED"
    );
    log.warn(
        "event=request_rejected method={} path={} clientIp={} traceId={} status={} detail={}",
        ExceptionResponseSupport.requestMethod(request),
        ExceptionResponseSupport.requestPath(uriInfo),
        ExceptionResponseSupport.clientIp(headers),
        ExceptionResponseSupport.traceId(),
        error.status(),
        error.detail()
    );
    return ExceptionResponseSupport.response(error);
  }

  private Response notFoundResponse(NotFoundException exception) {
    var error = new ErrorResponse(
        ERR_BASE + "not-found",
        "Not Found",
        Response.Status.NOT_FOUND.getStatusCode(),
        ExceptionResponseSupport.messageOrDefault(exception, "Resource not found"),
        "RESOURCE_NOT_FOUND"
    );
    log.debug(
        "event=request_rejected method={} path={} clientIp={} traceId={} status={} detail={}",
        ExceptionResponseSupport.requestMethod(request),
        ExceptionResponseSupport.requestPath(uriInfo),
        ExceptionResponseSupport.clientIp(headers),
        ExceptionResponseSupport.traceId(),
        error.status(),
        error.detail()
    );
    return ExceptionResponseSupport.response(error);
  }

  private Response badRequestResponse(BadRequestException exception) {
    var error = new ErrorResponse(
        ERR_BASE + "bad-request",
        "Bad Request",
        Response.Status.BAD_REQUEST.getStatusCode(),
        ExceptionResponseSupport.messageOrDefault(exception, "Bad request"),
        "BAD_REQUEST"
    );
    log.debug(
        "event=request_rejected method={} path={} clientIp={} traceId={} status={} detail={}",
        ExceptionResponseSupport.requestMethod(request),
        ExceptionResponseSupport.requestPath(uriInfo),
        ExceptionResponseSupport.clientIp(headers),
        ExceptionResponseSupport.traceId(),
        error.status(),
        error.detail()
    );
    return ExceptionResponseSupport.response(error);
  }

  private Response webApplicationResponse(WebApplicationException exception) {
    var status = ExceptionResponseSupport.normalizedStatus(exception);
    var title = ExceptionResponseSupport.title(status);
    var error = new ErrorResponse(
        ERR_BASE + "request-failed",
        title,
        status.getStatusCode(),
        ExceptionResponseSupport.messageOrDefault(exception, title),
        status.getStatusCode() >= 500 ? "REQUEST_FAILED" : "REQUEST_REJECTED"
    );
    if (ExceptionResponseSupport.isServerFailure(status)) {
      log.error(
          "event=request_failed method={} path={} clientIp={} traceId={} status={} detail={}",
          ExceptionResponseSupport.requestMethod(request),
          ExceptionResponseSupport.requestPath(uriInfo),
          ExceptionResponseSupport.clientIp(headers),
          ExceptionResponseSupport.traceId(),
          error.status(),
          error.detail(),
          exception
      );
    } else {
      log.debug(
          "event=request_rejected method={} path={} clientIp={} traceId={} status={} detail={}",
          ExceptionResponseSupport.requestMethod(request),
          ExceptionResponseSupport.requestPath(uriInfo),
          ExceptionResponseSupport.clientIp(headers),
          ExceptionResponseSupport.traceId(),
          error.status(),
          error.detail()
      );
    }
    return ExceptionResponseSupport.response(error);
  }

  private Response internalServerErrorResponse(Exception exception) {
    var error = new ErrorResponse(
        ERR_BASE + "internal-server-error",
        "Internal Server Error",
        Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(),
        "Internal server error",
        "INTERNAL_SERVER_ERROR"
    );
    log.error(
        "event=request_failed method={} path={} clientIp={} traceId={} status={} detail={}",
        ExceptionResponseSupport.requestMethod(request),
        ExceptionResponseSupport.requestPath(uriInfo),
        ExceptionResponseSupport.clientIp(headers),
        ExceptionResponseSupport.traceId(),
        error.status(),
        error.detail(),
        exception
    );
    return ExceptionResponseSupport.response(error);
  }
}
