package com.habittracker.sync;

import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.TreeSet;

@ApplicationScoped
public class SyncValueCodec {
  public String normalizeReminderTime(String value) {
    if (value == null || value.isBlank() || !value.matches("^\\d{2}:\\d{2}$")) {
      return null;
    }
    var timeParts = value.split(":");
    if (!isValidHourMinute(timeParts)) {
      return null;
    }
    return String.format("%02d:%02d", Integer.parseInt(timeParts[0]), Integer.parseInt(timeParts[1]));
  }

  public String normalizeCustomDaysJson(Object value, SyncPayloadCodec payloadCodec) {
    if (!(value instanceof List<?> items)) {
      return null;
    }
    var seen = new HashSet<Integer>();
    var result = new ArrayList<Integer>();
    for (var item : items) {
      var day = asValidDay(item);
      if (day != null && seen.add(day)) {
        result.add(day);
      }
    }
    return result.isEmpty() ? null : payloadCodec.jsonOrNull(result);
  }

  public String normalizeFreezeDaysJson(Object payloadValue, String existing, SyncPayloadCodec payloadCodec) {
    if (payloadValue == null) {
      return existing != null ? existing : "[]";
    }
    if (!(payloadValue instanceof List<?> items)) {
      return "[]";
    }
    var seen = new TreeSet<String>();
    for (var item : items) {
      if (item instanceof String value && value.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
        seen.add(value);
      }
    }
    return payloadCodec.jsonOrNull(new ArrayList<>(seen));
  }

  public BigInteger resolveSortOrder(Object payload, BigInteger existing) {
    if (payload instanceof Number number) {
      var value = number.doubleValue();
      if (Double.isFinite(value)) {
        return BigInteger.valueOf((long) value);
      }
    }
    return existing != null ? existing : BigInteger.ZERO;
  }

  public int resolveDailyTarget(Object payload, int existingValue) {
    if (payload instanceof Number number) {
      var value = number.doubleValue();
      if (Double.isFinite(value)) {
        return Math.max(1, (int) value);
      }
    }
    return Math.max(1, existingValue > 0 ? existingValue : 1);
  }

  public String asString(Object value) {
    if (value == null) {
      return null;
    }
    var text = String.valueOf(value);
    return text.isBlank() ? null : text;
  }

  public String nullableString(Object value) {
    return value == null ? null : String.valueOf(value);
  }

  public int asInt(Object value, int fallback) {
    if (value instanceof Number number) {
      return number.intValue();
    }
    if (value instanceof String text) {
      try {
        return Integer.parseInt(text);
      } catch (NumberFormatException exception) {
        return fallback;
      }
    }
    return fallback;
  }

  public boolean asBoolean(Object value, boolean fallback) {
    if (value instanceof Boolean bool) {
      return bool;
    }
    if (value instanceof String text) {
      return "true".equalsIgnoreCase(text) || "1".equals(text);
    }
    return fallback;
  }

  public String normalizeType(String type) {
    return "negative".equals(type) ? "negative" : "positive";
  }

  private boolean isValidHourMinute(String[] timeParts) {
    var hours = Integer.parseInt(timeParts[0]);
    var minutes = Integer.parseInt(timeParts[1]);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }

  private Integer asValidDay(Object item) {
    if (!(item instanceof Number number)) {
      return null;
    }
    var day = number.intValue();
    return day >= 0 && day <= 6 ? day : null;
  }
}
