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
  public HabitResponseDto {
    customDays = HabitRequestCollections.immutable(customDays);
    tags = HabitRequestCollections.immutable(tags);
    freezeDays = HabitRequestCollections.immutable(freezeDays);
  }

  @Override
  public List<Integer> customDays() {
    return HabitRequestCollections.immutable(customDays);
  }

  @Override
  public List<String> tags() {
    return HabitRequestCollections.immutable(tags);
  }

  @Override
  public List<String> freezeDays() {
    return HabitRequestCollections.immutable(freezeDays);
  }
}
