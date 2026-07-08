package com.sashplatonov.habbit.runner.checkin.support;

import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.api.OperationResult;
import com.sashplatonov.habbit.runner.checkin.dto.CheckinResponseDto;

public final class CheckinResponses {
  private static final String INVALID_DATE_TYPE = "https://habbit-runner.dev/errors/checkin-invalid-date";

  private CheckinResponses() {
  }

  public static OperationResult<CheckinResponseDto> invalidDate() {
    return invalidDateFailure();
  }

  public static OperationResult<Void> invalidDateVoid() {
    return invalidDateFailure();
  }

  private static <T> OperationResult<T> invalidDateFailure() {
    return OperationResult.failure(new ErrorResponse(
        INVALID_DATE_TYPE,
        "Bad Request",
        400,
        "Invalid checkin date",
        "CHECKIN_INVALID_DATE"
    ));
  }

  public static <T> OperationResult<T> notFound(String detail, String code) {
    return OperationResult.failure(new ErrorResponse(
        "https://habbit-runner.dev/errors/" + code.toLowerCase().replace('_', '-'),
        "Not Found",
        404,
        detail,
        code
    ));
  }
}
