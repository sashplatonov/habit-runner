package com.habittracker.sync;

import java.util.Locale;

enum SyncOperationType {
  UPSERT,
  DELETE;

  static SyncOperationType from(String rawValue) {
    var normalized = rawValue == null ? "" : rawValue.trim().toLowerCase(Locale.ROOT);
    return switch (normalized) {
      case "delete" -> DELETE;
      default -> UPSERT;
    };
  }
}