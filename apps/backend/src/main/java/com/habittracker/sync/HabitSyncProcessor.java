package com.habittracker.sync;

import com.habittracker.model.CheckinEntity;
import com.habittracker.model.HabitEntity;
import com.habittracker.model.TombstoneEntity;
import com.habittracker.sync.dto.PushConflict;
import com.habittracker.sync.dto.SyncOpDto;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.Map;

@ApplicationScoped
@Slf4j
public class HabitSyncProcessor {

  private final SyncPayloadCodec payloadCodec;
  private final SyncValueCodec valueCodec;
  private final SyncEntityMapper entityMapper;

  public HabitSyncProcessor(SyncPayloadCodec payloadCodec, SyncValueCodec valueCodec, SyncEntityMapper entityMapper) {
    this.payloadCodec = payloadCodec;
    this.valueCodec = valueCodec;
    this.entityMapper = entityMapper;
  }

  public void apply(String userId, SyncOpDto op, SyncPushState state) {
    var payload = payloadCodec.toMap(op.payload());
    var habitId = valueCodec.asString(payload.get("id"));
    if (habitId == null) {
      log.debug("Ignoring habit sync op without habit id: opId={}", op.id());
      return;
    }
    if (SyncOperationType.from(op.type()) == SyncOperationType.DELETE) {
      state.addAppliedHabitDelete(op.id(), deleteHabit(userId, habitId, payload));
      return;
    }

    var existing = (HabitEntity) HabitEntity.findById(habitId);
    var clientUpdated = payloadCodec.normalizeInstant(valueCodec.asString(payload.get("updatedAt")));
    var conflict = habitConflict(userId, op.id(), existing, clientUpdated);
    if (conflict != null) {
      log.debug("Detected habit sync conflict: opId={} habitId={}", op.id(), habitId);
      state.addConflict(conflict);
      return;
    }

    var habit = ensureHabitForUpsert(existing, habitId, userId, payload);
    populateHabit(habit, payload, clientUpdated);
    if (existing == null) {
      habit.persist();
    }
    state.addAppliedHabit(op.id(), habit);
  }

  private TombstoneEntity deleteHabit(String userId, String habitId, Map<String, Object> payload) {
    var tombstone = new TombstoneEntity();
    tombstone.userId = userId;
    tombstone.entity = "habit";
    tombstone.entityId = habitId;
    tombstone.version = valueCodec.asInt(payload.get("version"), 1);
    tombstone.setDeletedAt(payloadCodec.nextSyncDate(
        payloadCodec.parseInstantOrNow(valueCodec.asString(payload.get("updatedAt")))
    ));
    tombstone.persist();

    CheckinEntity.delete("habitId = ?1 and userId = ?2", habitId, userId);
    HabitEntity.delete("id = ?1 and userId = ?2", habitId, userId);
    return tombstone;
  }

  private PushConflict habitConflict(String userId, String opId, HabitEntity existing, Instant clientUpdated) {
    if (existing == null) {
      return null;
    }
    if (!userId.equals(existing.userId)) {
      return new PushConflict(opId, "habit belongs to another user", null);
    }
    if (existing.updatedAtValue().isAfter(clientUpdated)) {
      return entityMapper.buildConflict(opId, "server already has newer habit", existing.versionValue(), existing.updatedAtValue());
    }
    return null;
  }

  private HabitEntity ensureHabitForUpsert(
      HabitEntity existing,
      String habitId,
      String userId,
      Map<String, Object> payload
  ) {
    if (existing != null) {
      return existing;
    }

    var habit = new HabitEntity();
    habit.id = habitId;
    habit.userId = userId;
    var createdAt = valueCodec.asString(payload.get("createdAt"));
    habit.setCreatedAt(createdAt != null ? payloadCodec.parseInstantOrNow(createdAt) : Instant.now());
    return habit;
  }

  private void populateHabit(HabitEntity habit, Map<String, Object> payload, Instant clientUpdated) {
    habit.name = resolveString(payload.get("name"), habit.name, "Habit");
    habit.description = valueCodec.nullableString(payload.get("description"));
    habit.color = resolveString(payload.get("color"), habit.color, "#5E81AC");
    habit.icon = resolveString(payload.get("icon"), habit.icon, "star");
    habit.frequency = resolveString(payload.get("frequency"), habit.frequency, "daily");
    habit.customDays = valueCodec.normalizeCustomDaysJson(payload.get("customDays"), payloadCodec);
    habit.schedule = payloadCodec.jsonOrNull(payload.get("schedule"));
    habit.targetStreak = valueCodec.asInt(payload.get("targetStreak"), 1);
    habit.dailyTarget = valueCodec.resolveDailyTarget(payload.get("dailyTarget"), habit.dailyTarget);
    habit.tags = payloadCodec.jsonOrNull(payload.get("tags"));
    habit.archived = valueCodec.asBoolean(payload.get("archived"), false);
    habit.setSortOrder(valueCodec.resolveSortOrder(payload.get("sortOrder"), habit.sortOrderOrZero()));
    habit.reminderTime = valueCodec.normalizeReminderTime(valueCodec.asString(payload.get("reminderTime")));
    habit.reminderEnabled = valueCodec.asBoolean(payload.get("reminderEnabled"), habit.reminderEnabled);
    habit.type = valueCodec.normalizeType(valueCodec.asString(payload.get("type")));
    habit.freezeDays = valueCodec.normalizeFreezeDaysJson(payload.get("freezeDays"), habit.freezeDays, payloadCodec);
    habit.version = Math.max(habit.version, valueCodec.asInt(payload.get("version"), 0)) + 1;
    habit.setUpdatedAt(payloadCodec.nextSyncDate(clientUpdated, habit.updatedAtValue()));
  }

  private String resolveString(Object rawValue, String currentValue, String defaultValue) {
    var value = valueCodec.asString(rawValue);
    if (value != null) {
      return value;
    }
    if (currentValue != null) {
      return currentValue;
    }
    return defaultValue;
  }
}
