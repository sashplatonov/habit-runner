package com.sashplatonov.habbit.runner.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public enum HabitFrequency {
  DAILY("daily"),
  WEEKDAYS("weekdays"),
  WEEKENDS("weekends"),
  CUSTOM("custom");

  private static final Map<String, HabitFrequency> BY_VALUE = Arrays.stream(values())
      .collect(Collectors.toUnmodifiableMap(
          frequency -> frequency.value.toLowerCase(Locale.ROOT),
          Function.identity()
      ));

  private final String value;

  HabitFrequency(String value) {
    this.value = value;
  }

  @JsonValue
  public String value() {
    return value;
  }

  @JsonCreator
  public static HabitFrequency from(String rawValue) {
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
      return HabitFrequency.valueOf(normalized.toUpperCase(Locale.ROOT));
    } catch (IllegalArgumentException exception) {
      return null;
    }
  }

  public static HabitFrequency fromOrDefault(String rawValue, HabitFrequency fallback) {
    var parsed = from(rawValue);
    return parsed != null ? parsed : fallback;
  }
}
