package com.sashplatonov.habbit.runner.api;

public sealed interface OperationResult<T>
    permits OperationResult.Success, OperationResult.Failure {

  static <T> Success<T> success(T value) {
    return new Success<>(value);
  }

  static <T> Failure<T> failure(ErrorResponse error) {
    return new Failure<>(error);
  }

  record Success<T>(T value) implements OperationResult<T> {
  }

  record Failure<T>(ErrorResponse error) implements OperationResult<T> {
    public ErrorResponse toErrorResponse() {
      return error;
    }
  }
}
