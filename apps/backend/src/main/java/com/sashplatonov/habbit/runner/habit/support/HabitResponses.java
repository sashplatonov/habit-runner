package com.sashplatonov.habbit.runner.habit.support;

import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.api.OperationResult;

public final class HabitResponses {
  private static final String HABIT_NOT_FOUND_TYPE = "https://habbit-runner.dev/errors/habit-not-found";
  private static final String HABIT_CONFLICT_TYPE = "https://habbit-runner.dev/errors/habit-conflict";
  private static final String VERSION_CONFLICT_TYPE = "https://habbit-runner.dev/errors/conflict";

  private HabitResponses() {
  }

  public static <T> OperationResult<T> notFound() {
    return OperationResult.failure(new ErrorResponse(
        HABIT_NOT_FOUND_TYPE,
        "Not Found",
        404,
        "Habit not found",
        "HABIT_NOT_FOUND"
    ));
  }

  public static <T> OperationResult<T> idConflict() {
    return OperationResult.failure(new ErrorResponse(
        HABIT_CONFLICT_TYPE,
        "Conflict",
        409,
        "Habit id already exists",
        "HABIT_CONFLICT"
    ));
  }

  public static <T> OperationResult<T> versionConflict() {
    return OperationResult.failure(new ErrorResponse(
        VERSION_CONFLICT_TYPE,
        "Conflict",
        409,
        "The resource was changed by another request",
        "RESOURCE_VERSION_CONFLICT"
    ));
  }
}
