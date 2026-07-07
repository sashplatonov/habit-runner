package com.sashplatonov.habbit.runner.api;

public sealed interface OperationResult<T>
    permits OperationSuccess, OperationFailure {

  static <T> OperationSuccess<T> success(T value) {
    return new OperationSuccess<>(value);
  }

  static <T> OperationFailure<T> failure(ErrorResponse error) {
    return new OperationFailure<>(error);
  }
}
