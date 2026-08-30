package com.sashplatonov.habbit.runner.habit.support;

import com.sashplatonov.habbit.runner.api.OperationFailure;
import com.sashplatonov.habbit.runner.api.OperationResult;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

class HabitResponsesTest {

  @Test
  void notFoundCarriesHabitNotFoundPayload() {
    var result = HabitResponses.notFound();

    var error = assertInstanceOf(OperationFailure.class, result).toErrorResponse();
    assertEquals("https://habbit-runner.dev/errors/habit-not-found", error.type());
    assertEquals("Not Found", error.title());
    assertEquals(404, error.status());
    assertEquals("Habit not found", error.detail());
    assertEquals("HABIT_NOT_FOUND", error.errorCode());
  }

  @Test
  void idConflictCarriesHabitConflictPayload() {
    var result = HabitResponses.idConflict();

    var error = assertInstanceOf(OperationFailure.class, result).toErrorResponse();
    assertEquals("https://habbit-runner.dev/errors/habit-conflict", error.type());
    assertEquals("Conflict", error.title());
    assertEquals(409, error.status());
    assertEquals("Habit id already exists", error.detail());
    assertEquals("HABIT_CONFLICT", error.errorCode());
  }

  @Test
  void versionConflictCarriesResourceVersionConflictPayload() {
    var result = HabitResponses.versionConflict();

    var error = assertInstanceOf(OperationFailure.class, result).toErrorResponse();
    assertEquals("https://habbit-runner.dev/errors/conflict", error.type());
    assertEquals("Conflict", error.title());
    assertEquals(409, error.status());
    assertEquals("The resource was changed by another request", error.detail());
    assertEquals("RESOURCE_VERSION_CONFLICT", error.errorCode());
  }

  @Test
  void notFoundIsGenericAcrossResultTypes() {
    OperationResult<Void> voidResult = HabitResponses.notFound();
    OperationResult<String> stringResult = HabitResponses.notFound();

    assertEquals(404, assertInstanceOf(OperationFailure.class, voidResult).toErrorResponse().status());
    assertEquals(404, assertInstanceOf(OperationFailure.class, stringResult).toErrorResponse().status());
  }
}
