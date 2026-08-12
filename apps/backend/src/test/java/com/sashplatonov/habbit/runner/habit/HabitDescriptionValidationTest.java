package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.habit.dto.HabitCreateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitUpdateRequestDto;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HabitDescriptionValidationTest {
  private static final int MAX_DESCRIPTION_LENGTH = 8000;

  @Test
  void shouldAcceptDescriptionsAtTheMaximumLength() {
    try (var factory = Validation.buildDefaultValidatorFactory()) {
      var validator = factory.getValidator();

      assertEquals(0, descriptionViolations(validator, HabitCreateRequestDto.builder()
          .description("x".repeat(MAX_DESCRIPTION_LENGTH))
          .build()));
      assertEquals(0, descriptionViolations(validator, HabitUpdateRequestDto.builder()
          .description("x".repeat(MAX_DESCRIPTION_LENGTH))
          .build()));
    }
  }

  @Test
  void shouldRejectDescriptionsOverTheMaximumLength() {
    try (var factory = Validation.buildDefaultValidatorFactory()) {
      var validator = factory.getValidator();

      assertEquals(1, descriptionViolations(validator, HabitCreateRequestDto.builder()
          .description("x".repeat(MAX_DESCRIPTION_LENGTH + 1))
          .build()));
      assertEquals(1, descriptionViolations(validator, HabitUpdateRequestDto.builder()
          .description("x".repeat(MAX_DESCRIPTION_LENGTH + 1))
          .build()));
    }
  }

  private long descriptionViolations(Validator validator, Object request) {
    return validator.validate(request).stream()
        .filter(violation -> "description".equals(violation.getPropertyPath().toString()))
        .count();
  }
}
