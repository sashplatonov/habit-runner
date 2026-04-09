package com.habittracker.sync;

import java.util.List;
import java.util.Map;

public final class SyncDtos {
  private SyncDtos() {
  }

  public record SyncOpDto(String id, String entity, String type, Map<String, Object> payload, String clientTime) {
  }

  public record PushRequestDto(List<SyncOpDto> ops) {
  }

  public record PushConflict(String opId, String reason, Map<String, Object> serverValue) {
  }

  public record PushResponseDto(
      List<String> applied,
      List<PushConflict> conflicts,
      List<HabitDto> habits,
      List<CheckinDto> checkins,
      List<TombstoneDto> tombstones,
      String nextCursor,
      String serverTime
  ) {
  }

  public record HabitDto(
      String id,
      String name,
      String description,
      String color,
      String icon,
      String frequency,
      Object customDays,
      Object schedule,
      int targetStreak,
      int dailyTarget,
      Object tags,
      boolean archived,
      String createdAt,
      String updatedAt,
      int version,
      int sortOrder,
      String reminderTime,
      Boolean reminderEnabled,
      String type,
      Object freezeDays
  ) {
  }

  public record CheckinDto(
      String id,
      String habitId,
      String date,
      boolean done,
      Integer count,
      String updatedAt,
      int version
  ) {
  }

  public record TombstoneDto(
      String id,
      String entity,
      String entityId,
      String deletedAt,
      int version
  ) {
  }

  public record PullResponseDto(
      List<HabitDto> habits,
      List<CheckinDto> checkins,
      List<TombstoneDto> tombstones,
      String nextCursor,
      String serverTime
  ) {
  }
}
