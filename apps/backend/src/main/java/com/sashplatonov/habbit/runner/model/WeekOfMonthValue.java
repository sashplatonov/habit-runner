package com.sashplatonov.habbit.runner.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum WeekOfMonthValue {
  FIRST(1),
  SECOND(2),
  THIRD(3),
  FOURTH(4),
  LAST("last");

  private final Object value;

  WeekOfMonthValue(Object value) {
    this.value = value;
  }

  @JsonValue
  public Object value() {
    return value;
  }

  @JsonCreator
  public static WeekOfMonthValue from(Object rawValue) {
    if (rawValue == null) {
      return null;
    }
    if (rawValue instanceof Number number) {
      return fromNumber(number.intValue());
    }
    var normalized = rawValue.toString().trim().toLowerCase();
    if (normalized.isEmpty()) {
      return null;
    }
    return switch (normalized) {
      case "1" -> FIRST;
      case "2" -> SECOND;
      case "3" -> THIRD;
      case "4" -> FOURTH;
      case "last" -> LAST;
      default -> null;
    };
  }

  private static WeekOfMonthValue fromNumber(int value) {
    return switch (value) {
      case 1 -> FIRST;
      case 2 -> SECOND;
      case 3 -> THIRD;
      case 4 -> FOURTH;
      default -> null;
    };
  }
}
