package com.sashplatonov.habbit.runner.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public enum HabitScheduleType {
  DAILY("daily"),
  WEEKLY_DAYS("weekly_days"),
  WEEKLY_QUOTA("weekly_quota"),
  MONTHLY_WEEKS("monthly_weeks"),
  MONTHLY_QUOTA("monthly_quota");

  private static final Map<String, HabitScheduleType> BY_VALUE = Arrays.stream(values())
      .collect(Collectors.toUnmodifiableMap(
          type -> type.value.toLowerCase(Locale.ROOT),
          Function.identity()
      ));

  private final String value;

  HabitScheduleType(String value) {
    this.value = value;
  }

  @JsonValue
  public String value() {
    return value;
  }

  @JsonCreator
  public static HabitScheduleType from(String rawValue) {
    if (rawValue == null) {
      return null;
    }
    var normalized = rawValue.trim().toLowerCase(Locale.ROOT);
    if (normalized.isEmpty()) {
      return null;
    }
    var byValue = BY_VALUE.get(normalized);
    if (byValue != null) {
      return byValue;
    }
    try {
      return HabitScheduleType.valueOf(normalized.toUpperCase(Locale.ROOT));
    } catch (IllegalArgumentException exception) {
      return null;
    }
  }
}
