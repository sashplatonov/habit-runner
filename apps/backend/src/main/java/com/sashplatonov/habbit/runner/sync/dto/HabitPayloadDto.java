package com.sashplatonov.habbit.runner.sync.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import lombok.Builder;

import java.util.List;

@Builder
public record HabitPayloadDto(
    String id,
    String name,
    String description,
    HabitColor color,
    String icon,
    HabitFrequency frequency,
    List<Integer> customDays,
    JsonNode schedule,
    Integer targetStreak,
    Integer dailyTarget,
    List<String> tags,
    Boolean archived,
    String createdAt,
    String updatedAt,
    Integer version,
    Integer sortOrder,
    String reminderTime,
    Boolean reminderEnabled,
    HabitType type,
    List<String> freezeDays
) {
}
