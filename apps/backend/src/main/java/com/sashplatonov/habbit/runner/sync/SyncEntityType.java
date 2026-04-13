package com.sashplatonov.habbit.runner.sync;

import java.util.Locale;

enum SyncEntityType {
  HABIT,
  CHECKIN;

  static SyncEntityType from(String rawValue) {
    var normalized = rawValue == null ? "" : rawValue.trim().toLowerCase(Locale.ROOT);
    return switch (normalized) {
      case "habit" -> HABIT;
      case "checkin" -> CHECKIN;
      default -> null;
    };
  }
}
