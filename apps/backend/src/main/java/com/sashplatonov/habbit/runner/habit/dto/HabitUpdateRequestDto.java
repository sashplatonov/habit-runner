package com.sashplatonov.habbit.runner.habit.dto;

import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.List;

@Builder
public record HabitUpdateRequestDto(
    @Size(max = 200) String name,
    @Size(max = 2000) String description,
    HabitColor color,
    @Size(max = 100) String icon,
    HabitFrequency frequency,
    @Size(max = 7) List<Integer> customDays,
    HabitScheduleDto schedule,
    @Positive Integer targetStreak,
    @Positive Integer dailyTarget,
    List<String> tags,
    Boolean archived,
    Long sortOrder,
    String reminderTime,
    Boolean reminderEnabled,
    HabitType type,
    @Size(max = 366) List<String> freezeDays,
    Integer version
) {
}
