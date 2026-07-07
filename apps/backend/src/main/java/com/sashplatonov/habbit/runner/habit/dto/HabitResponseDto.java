package com.sashplatonov.habbit.runner.habit.dto;

import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import lombok.Builder;

import java.util.List;

@Builder
public record HabitResponseDto(
    String id,
    String name,
    String description,
    HabitColor color,
    String icon,
    HabitFrequency frequency,
    List<Integer> customDays,
    HabitScheduleDto schedule,
    int targetStreak,
    int dailyTarget,
    List<String> tags,
    boolean archived,
    String createdAt,
    String updatedAt,
    int version,
    long sortOrder,
    String reminderTime,
    boolean reminderEnabled,
    HabitType type,
    List<String> freezeDays
) {
}
