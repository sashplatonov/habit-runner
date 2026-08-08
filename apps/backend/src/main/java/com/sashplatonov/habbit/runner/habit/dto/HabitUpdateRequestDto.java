package com.sashplatonov.habbit.runner.habit.dto;

import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import lombok.Builder;

import java.util.List;

@Builder
public record HabitUpdateRequestDto(
    String name,
    String description,
    HabitColor color,
    String icon,
    HabitFrequency frequency,
    List<Integer> customDays,
    HabitScheduleDto schedule,
    Integer targetStreak,
    Integer dailyTarget,
    List<String> tags,
    Boolean archived,
    Long sortOrder,
    String reminderTime,
    Boolean reminderEnabled,
    HabitType type,
    List<String> freezeDays,
    Integer version
) {
}
