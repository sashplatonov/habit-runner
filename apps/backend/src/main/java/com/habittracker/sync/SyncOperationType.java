package com.habittracker.sync;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum SyncOperationType {
  UPSERT,
  DELETE;

  @JsonCreator
  public static SyncOperationType from(String rawValue) {
    var normalized = rawValue == null ? "" : rawValue.trim().toLowerCase(Locale.ROOT);
    return switch (normalized) {
      case "delete" -> DELETE;
      default -> UPSERT;
    };
  }

  @JsonValue
  public String value() {
    return this == DELETE ? "delete" : "upsert";
  }

  @Override
  public String toString() {
    return value();
  }
}