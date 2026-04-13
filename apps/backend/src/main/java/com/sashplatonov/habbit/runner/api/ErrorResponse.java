package com.sashplatonov.habbit.runner.api;

public record ErrorResponse(
    String type,
    String title,
    int status,
    String detail,
    String errorCode
) {
}
