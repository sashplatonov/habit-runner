package com.sashplatonov.habbit.runner.habit.dto;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class HabitScheduleValidator implements ConstraintValidator<ValidHabitSchedule, HabitScheduleDto> {
  @Override
  public boolean isValid(HabitScheduleDto schedule, ConstraintValidatorContext context) {
    if (schedule == null) {
      return true;
    }

    if (schedule.type() == null) {
      return true;
    }

    return isValidScheduleType(schedule);
  }

  private boolean isValidScheduleType(HabitScheduleDto schedule) {
    return switch (schedule.type()) {
      case DAILY -> true;
      case WEEKLY_DAYS -> hasValues(schedule.weekdays());
      case WEEKLY_QUOTA -> schedule.timesPerWeek() != null;
      case MONTHLY_QUOTA -> schedule.timesPerMonth() != null;
      case MONTHLY_WEEKS -> hasValues(schedule.weekdays()) && hasValues(schedule.weeksOfMonth());
    };
  }

  private boolean hasValues(java.util.List<?> values) {
    return values != null && !values.isEmpty();
  }
}
