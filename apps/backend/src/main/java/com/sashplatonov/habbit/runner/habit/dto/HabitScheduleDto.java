package com.sashplatonov.habbit.runner.habit.dto;

import com.sashplatonov.habbit.runner.model.HabitScheduleType;
import com.sashplatonov.habbit.runner.model.WeekOfMonthValue;
import lombok.Builder;

import java.util.List;

@Builder
public record HabitScheduleDto(
    HabitScheduleType type,
    List<Integer> weekdays,
    Integer timesPerWeek,
    Integer timesPerMonth,
    List<WeekOfMonthValue> weeksOfMonth
) {
}
