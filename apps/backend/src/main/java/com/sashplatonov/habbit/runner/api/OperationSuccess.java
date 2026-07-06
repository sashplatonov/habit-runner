package com.sashplatonov.habbit.runner.api;

public record OperationSuccess<T>(T value) implements OperationResult<T> {
}
