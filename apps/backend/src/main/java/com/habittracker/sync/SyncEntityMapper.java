package com.habittracker.sync;

import com.habittracker.model.CheckinEntity;
import com.habittracker.model.HabitEntity;
import com.habittracker.model.TombstoneEntity;
import com.habittracker.sync.dto.CheckinDto;
import com.habittracker.sync.dto.HabitDto;
import com.habittracker.sync.dto.PushConflict;
import com.habittracker.sync.dto.TombstoneDto;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.Map;

@ApplicationScoped
public class SyncEntityMapper {
  private final SyncPayloadCodec payloadCodec;

  public SyncEntityMapper(SyncPayloadCodec payloadCodec) {
    this.payloadCodec = payloadCodec;
  }

  public SyncCursor habitCursor(HabitEntity habit) {
    return new SyncCursor(habit.updatedAtValue(), habit.id);
  }

  public SyncCursor checkinCursor(CheckinEntity checkin) {
    return new SyncCursor(checkin.updatedAtValue(), checkin.id);
  }

  public SyncCursor tombstoneCursor(TombstoneEntity tombstone) {
    return new SyncCursor(tombstone.deletedAtValue(), tombstone.id);
  }

  public HabitDto serializeHabit(HabitEntity habit) {
    return new HabitDto(
        habit.id,
        habit.name,
        habit.description == null ? "" : habit.description,
        habit.color,
        habit.icon,
        habit.frequency,
        payloadCodec.parseJsonOrNull(habit.customDays),
        payloadCodec.parseJsonOrNull(habit.schedule),
        habit.targetStreak,
        habit.dailyTarget,
        payloadCodec.parseJsonOrEmptyList(habit.tags),
        habit.archived,
        payloadCodec.toSyncIso(habit.createdAtValue()),
        payloadCodec.toSyncIso(habit.updatedAtValue()),
        habit.versionValue(),
        habit.sortOrderOrZero().intValue(),
        habit.reminderTime,
        habit.reminderEnabled,
        habit.type,
        payloadCodec.parseJsonOrEmptyList(habit.freezeDays)
    );
  }

  public CheckinDto serializeCheckin(CheckinEntity checkin) {
    return new CheckinDto(
        checkin.id,
        checkin.habitId,
        checkin.syncDate().toString(),
        checkin.done,
        checkin.count,
        payloadCodec.toSyncIso(checkin.updatedAtValue()),
        checkin.version
    );
  }

  public TombstoneDto serializeTombstone(TombstoneEntity tombstone) {
    return new TombstoneDto(
        tombstone.id,
        tombstone.entity,
        tombstone.entityId,
        payloadCodec.toSyncIso(tombstone.deletedAtValue()),
        tombstone.version
    );
  }

  public PushConflict buildConflict(String opId, String message, int version, Instant updatedAt) {
    return new PushConflict(opId, message, Map.of(
        "version", version,
        "updatedAt", payloadCodec.toSyncIso(updatedAt)
    ));
  }

  public PushConflict buildMissingEntityConflict(String opId, String message) {
    return new PushConflict(opId, message, null);
  }
}
