package com.sashplatonov.habbit.runner.habit.dto;

import com.sashplatonov.habbit.runner.model.HabitScheduleType;
import com.sashplatonov.habbit.runner.model.WeekOfMonthValue;
import lombok.Builder;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.List;

@Builder
public record HabitScheduleDto(
    HabitScheduleType type,
    @Size(max = 7) List<@Min(1) @Max(7) Integer> weekdays,
    @Min(1) @Max(7) Integer timesPerWeek,
    @Min(1) @Max(31) Integer timesPerMonth,
    @Size(max = 5) List<WeekOfMonthValue> weeksOfMonth
) {
  public HabitScheduleDto {
    weekdays = HabitRequestCollections.immutable(weekdays);
    weeksOfMonth = HabitRequestCollections.immutable(weeksOfMonth);
  }

  @Override
  public List<Integer> weekdays() {
    return HabitRequestCollections.immutable(weekdays);
  }

  @Override
  public List<WeekOfMonthValue> weeksOfMonth() {
    return HabitRequestCollections.immutable(weeksOfMonth);
  }
}
