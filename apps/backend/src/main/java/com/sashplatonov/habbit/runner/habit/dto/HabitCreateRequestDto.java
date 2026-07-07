package com.sashplatonov.habbit.runner.habit.dto;

import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.List;

@Builder
public record HabitCreateRequestDto(
    @NotBlank String id,
    @NotBlank String name,
    String description,
    @NotNull HabitColor color,
    @NotBlank String icon,
    @NotNull HabitFrequency frequency,
    List<Integer> customDays,
    HabitScheduleDto schedule,
    @Positive int targetStreak,
    @Positive int dailyTarget,
    @Size(max = 50) List<String> tags,
    Boolean archived,
    Long sortOrder,
    String reminderTime,
    Boolean reminderEnabled,
    HabitType type,
    List<String> freezeDays
) {
}
