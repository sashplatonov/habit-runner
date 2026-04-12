package com.sashplatonov.habbit.runner.api;

import jakarta.ws.rs.core.Response;

public sealed interface OperationResult<T>
    permits OperationResult.Success, OperationResult.Failure {

  static <T> Success<T> success(T value) {
    return new Success<>(value);
  }

  @SuppressWarnings("PMD.ExcessiveParameterList")
  static <T> Failure<T> failure(
      String type,
      String title,
      Response.StatusType status,
      String detail,
      String errorCode
  ) {
    return new Failure<>(type, title, status.getStatusCode(), detail, errorCode);
  }

  record Success<T>(T value) implements OperationResult<T> {
  }

  record Failure<T>(
      String type,
      String title,
      int status,
      String detail,
      String errorCode
  ) implements OperationResult<T> {
    public ErrorResponse toErrorResponse() {
      return new ErrorResponse(type, title, status, detail, errorCode);
    }
  }
}