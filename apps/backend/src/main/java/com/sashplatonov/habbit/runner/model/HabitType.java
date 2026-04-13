package com.sashplatonov.habbit.runner.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public enum HabitType {
  POSITIVE("positive"),
  NEGATIVE("negative");

  private static final Map<String, HabitType> BY_VALUE = Arrays.stream(values())
      .collect(Collectors.toUnmodifiableMap(
          type -> type.value.toLowerCase(Locale.ROOT),
          Function.identity()
      ));

  private final String value;

  HabitType(String value) {
    this.value = value;
  }

  @JsonValue
  public String value() {
    return value;
  }

  @JsonCreator
  public static HabitType from(String rawValue) {
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
      return HabitType.valueOf(normalized.toUpperCase(Locale.ROOT));
    } catch (IllegalArgumentException exception) {
      return null;
    }
  }

  public static HabitType fromOrDefault(String rawValue, HabitType fallback) {
    var parsed = from(rawValue);
    return parsed != null ? parsed : fallback;
  }
}
