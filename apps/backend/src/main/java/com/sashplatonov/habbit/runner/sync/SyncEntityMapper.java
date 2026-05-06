package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import com.sashplatonov.habbit.runner.sync.dto.CheckinDto;
import com.sashplatonov.habbit.runner.sync.dto.HabitDto;
import com.sashplatonov.habbit.runner.sync.dto.TombstoneDto;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class SyncEntityMapper {
  private final SyncPayloadCodec payloadCodec;
  private final SyncJsonCodec jsonCodec;

  public SyncEntityMapper(SyncPayloadCodec payloadCodec) {
    this.payloadCodec = payloadCodec;
    this.jsonCodec = new SyncJsonCodec(payloadCodec.objectMapper());
  }

  public SyncCursor habitCursor(HabitEntity habit) {
    return SyncCursor.builder()
        .updatedAt(habit.updatedAt)
        .id(habit.id)
        .build();
  }

  public SyncCursor checkinCursor(CheckinEntity checkin) {
    return SyncCursor.builder()
        .updatedAt(checkin.updatedAt)
        .id(checkin.id)
        .build();
  }

  public SyncCursor tombstoneCursor(TombstoneEntity tombstone) {
    return SyncCursor.builder()
        .updatedAt(tombstone.deletedAt)
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
        .customDays(jsonCodec.parseIntegerListOrNull(habit.customDays))
        .schedule(jsonCodec.parseJsonNodeOrNull(habit.schedule))
        .targetStreak(habit.targetStreak)
        .dailyTarget(habit.dailyTarget)
        .tags(jsonCodec.parseStringListOrEmpty(habit.tags))
        .archived(habit.archived)
        .createdAt(payloadCodec.toSyncIso(habit.createdAt))
        .updatedAt(payloadCodec.toSyncIso(habit.updatedAt))
        .version(habit.version)
        .sortOrder(habit.sortOrder == null ? 0 : habit.sortOrder.intValue())
        .reminderTime(habit.reminderTime)
        .reminderEnabled(habit.reminderEnabled)
        .type(habit.type)
        .freezeDays(jsonCodec.parseStringListOrEmpty(habit.freezeDays))
        .build();
  }

  public CheckinDto serializeCheckin(CheckinEntity checkin) {
    return CheckinDto.builder()
        .id(checkin.id)
        .habitId(checkin.habitId)
        .date(checkin.date != null ? checkin.date.toString() : null)
        .done(checkin.done)
        .count(checkin.count)
        .updatedAt(payloadCodec.toSyncIso(checkin.updatedAt))
        .version(checkin.version)
        .build();
  }

  public TombstoneDto serializeTombstone(TombstoneEntity tombstone) {
    return TombstoneDto.builder()
        .id(tombstone.id)
        .entity(tombstone.entity)
        .entityId(tombstone.entityId)
        .deletedAt(payloadCodec.toSyncIso(tombstone.deletedAt))
        .version(tombstone.version)
        .build();
  }
}
