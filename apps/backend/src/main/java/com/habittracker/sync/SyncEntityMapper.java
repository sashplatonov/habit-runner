package com.habittracker.sync;

import com.habittracker.model.CheckinEntity;
import com.habittracker.model.HabitEntity;
import com.habittracker.model.TombstoneEntity;
import com.habittracker.sync.dto.CheckinDto;
import com.habittracker.sync.dto.ConflictServerValueDto;
import com.habittracker.sync.dto.HabitDto;
import com.habittracker.sync.dto.PushConflict;
import com.habittracker.sync.dto.TombstoneDto;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;

@ApplicationScoped
public class SyncEntityMapper {
  private final SyncPayloadCodec payloadCodec;

  public SyncEntityMapper(SyncPayloadCodec payloadCodec) {
    this.payloadCodec = payloadCodec;
  }

  public SyncCursor habitCursor(HabitEntity habit) {
    return SyncCursor.builder()
        .updatedAt(habit.updatedAtValue())
        .id(habit.id)
        .build();
  }

  public SyncCursor checkinCursor(CheckinEntity checkin) {
    return SyncCursor.builder()
        .updatedAt(checkin.updatedAtValue())
        .id(checkin.id)
        .build();
  }

  public SyncCursor tombstoneCursor(TombstoneEntity tombstone) {
    return SyncCursor.builder()
        .updatedAt(tombstone.deletedAtValue())
        .id(tombstone.id)
        .build();
  }

  public HabitDto serializeHabit(HabitEntity habit) {
    return HabitDto.builder()
        .id(habit.id)
        .name(habit.name)
        .description(habit.description == null ? "" : habit.description)
        .color(habit.color)
        .icon(habit.icon)
        .frequency(habit.frequency)
        .customDays(payloadCodec.parseIntegerListOrNull(habit.customDays))
        .schedule(payloadCodec.parseJsonNodeOrNull(habit.schedule))
        .targetStreak(habit.targetStreak)
        .dailyTarget(habit.dailyTarget)
        .tags(payloadCodec.parseStringListOrEmpty(habit.tags))
        .archived(habit.archived)
        .createdAt(payloadCodec.toSyncIso(habit.createdAtValue()))
        .updatedAt(payloadCodec.toSyncIso(habit.updatedAtValue()))
        .version(habit.versionValue())
        .sortOrder(habit.sortOrderOrZero().intValue())
        .reminderTime(habit.reminderTime)
        .reminderEnabled(habit.reminderEnabled)
        .type(habit.type)
          .freezeDays(payloadCodec.parseStringListOrEmpty(habit.freezeDays))
        .build();
  }

  public CheckinDto serializeCheckin(CheckinEntity checkin) {
    return CheckinDto.builder()
        .id(checkin.id)
        .habitId(checkin.habitId)
        .date(checkin.syncDate().toString())
        .done(checkin.done)
        .count(checkin.count)
        .updatedAt(payloadCodec.toSyncIso(checkin.updatedAtValue()))
        .version(checkin.version)
        .build();
  }

  public TombstoneDto serializeTombstone(TombstoneEntity tombstone) {
    return TombstoneDto.builder()
        .id(tombstone.id)
        .entity(tombstone.entity)
        .entityId(tombstone.entityId)
        .deletedAt(payloadCodec.toSyncIso(tombstone.deletedAtValue()))
        .version(tombstone.version)
        .build();
  }

  public PushConflict buildConflict(String opId, String message, int version, Instant updatedAt) {
    return PushConflict.builder()
        .opId(opId)
        .reason(message)
        .serverValue(ConflictServerValueDto.builder()
            .version(version)
            .updatedAt(payloadCodec.toSyncIso(updatedAt))
            .build())
        .build();
  }

  public PushConflict buildMissingEntityConflict(String opId, String message) {
    return PushConflict.builder()
        .opId(opId)
        .reason(message)
        .serverValue(null)
        .build();
  }
}
