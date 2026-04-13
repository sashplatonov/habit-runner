package com.sashplatonov.habbit.runner.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public enum HabitColor {
  BLUE("blue"),
  GREEN("green"),
  PURPLE("purple"),
  ORANGE("orange"),
  RED("red"),
  CYAN("cyan"),
  LEGACY_NORD("#5E81AC"),
  LEGACY_SLATE("#1F2937"),
  LEGACY_CHARCOAL("#111827");

  private static final Map<String, HabitColor> BY_VALUE = Arrays.stream(values())
      .collect(Collectors.toUnmodifiableMap(
          color -> color.value.toLowerCase(Locale.ROOT),
          Function.identity()
      ));

  private final String value;

  HabitColor(String value) {
    this.value = value;
  }

  @JsonValue
  public String value() {
    return value;
  }

  @JsonCreator
  public static HabitColor from(String rawValue) {
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
      return HabitColor.valueOf(normalized.toUpperCase(Locale.ROOT));
    } catch (IllegalArgumentException exception) {
      return null;
    }
  }

  public static HabitColor fromOrDefault(String rawValue, HabitColor fallback) {
    var parsed = from(rawValue);
    return parsed != null ? parsed : fallback;
  }
}
