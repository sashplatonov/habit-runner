package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
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

  public String normalizeCustomDaysJson(List<Integer> value, SyncPayloadCodec payloadCodec) {
    if (value == null) {
      return null;
    }
    var seen = new HashSet<Integer>();
    var result = new ArrayList<Integer>();
    for (var day : value) {
      var normalizedDay = asValidDay(day);
      if (normalizedDay != null && seen.add(normalizedDay)) {
        result.add(normalizedDay);
      }
    }
    return result.isEmpty() ? null : payloadCodec.jsonOrNull(result);
  }

  public String normalizeFreezeDaysJson(List<String> payloadValue, String existing, SyncPayloadCodec payloadCodec) {
    if (payloadValue == null) {
      return existing != null ? existing : "[]";
    }
    var seen = new TreeSet<String>();
    for (var value : payloadValue) {
      if (value != null && value.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
        seen.add(value);
      }
    }
    return payloadCodec.jsonOrNull(new ArrayList<>(seen));
  }

  public BigInteger resolveSortOrder(Integer payload, BigInteger existing) {
    if (payload != null) {
      return BigInteger.valueOf(payload.longValue());
    }
    return existing != null ? existing : BigInteger.ZERO;
  }

  public int resolveDailyTarget(Integer payload, int existingValue) {
    if (payload != null) {
      return Math.max(1, payload);
    }
    return Math.max(1, existingValue > 0 ? existingValue : 1);
  }

  public String asString(String value) {
    if (value == null) {
      return null;
    }
    return value.isBlank() ? null : value;
  }

  public HabitColor normalizeColor(HabitColor payload, HabitColor existingValue) {
    if (payload != null) {
      return payload;
    }
    return existingValue != null ? existingValue : HabitColor.BLUE;
  }

  public HabitFrequency normalizeFrequency(HabitFrequency payload, HabitFrequency existingValue) {
    if (payload != null) {
      return payload;
    }
    return existingValue != null ? existingValue : HabitFrequency.DAILY;
  }

  public HabitType normalizeType(HabitType type) {
    return HabitType.NEGATIVE.equals(type) ? HabitType.NEGATIVE : HabitType.POSITIVE;
  }

  private boolean isValidHourMinute(String[] timeParts) {
    var hours = Integer.parseInt(timeParts[0]);
    var minutes = Integer.parseInt(timeParts[1]);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }

  private Integer asValidDay(Integer day) {
    if (day == null) {
      return null;
    }
    return day >= 0 && day <= 6 ? day : null;
  }
}
