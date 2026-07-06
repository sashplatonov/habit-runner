package com.sashplatonov.habbit.runner.api;

public record OperationFailure<T>(ErrorResponse error) implements OperationResult<T> {
  public ErrorResponse toErrorResponse() {
    return error;
  }
}
