package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.sync.dto.HabitPayloadDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;

@ApplicationScoped
public class HabitSyncUpsertHandler {
  private final SyncValueCodec valueCodec;
  private final SyncJsonCodec jsonCodec;
  private final HabitSyncStore habitSyncStore;

  public HabitSyncUpsertHandler(SyncValueCodec valueCodec, SyncJsonCodec jsonCodec) {
    this(valueCodec, jsonCodec, new HabitSyncStore());
  }

  @Inject
  public HabitSyncUpsertHandler(
      SyncValueCodec valueCodec,
      SyncJsonCodec jsonCodec,
      HabitSyncStore habitSyncStore
  ) {
    this.valueCodec = valueCodec;
    this.jsonCodec = jsonCodec;
    this.habitSyncStore = habitSyncStore;
  }

  public HabitEntity findHabitById(String habitId) {
    return habitSyncStore.findHabitById(habitId);
  }

  public HabitEntity ensureHabitForUpsert(
      HabitEntity existing,
      String habitId,
      String userId,
      Instant createdAt
  ) {
    if (existing != null) {
      return existing;
    }

    var habit = new HabitEntity();
    habit.id = habitId;
    habit.userId = userId;
    habit.setCreatedAt(createdAt);
    return habit;
  }

  public void populateHabit(HabitEntity habit, HabitPayloadDto payload, Instant clientUpdated, SyncPayloadCodec payloadCodec) {
    applyTextFields(habit, payload);
    applyIdentityFields(habit, payload);
    applyScheduleFields(habit, payload);
    applyMetadataFields(habit, payload);
    applyAuditFields(habit, payload, clientUpdated, payloadCodec);
  }

  public void saveHabit(HabitEntity habit) {
    habitSyncStore.saveHabit(habit);
  }

  private void applyTextFields(HabitEntity habit, HabitPayloadDto payload) {
    var name = payload == null ? null : payload.name();
    var description = payload == null ? null : payload.description();
    var icon = payload == null ? null : payload.icon();

    habit.name = resolvedString(name, habit.name, "Habit");
    habit.description = description;
    habit.icon = resolvedString(icon, habit.icon, "star");
  }

  private void applyIdentityFields(HabitEntity habit, HabitPayloadDto payload) {
    if (payload == null) {
      return;
    }
    if (payload.color() != null) {
      habit.setColor(valueCodec.normalizeColor(payload.color(), null));
    }
    if (payload.frequency() != null) {
      habit.setFrequency(valueCodec.normalizeFrequency(payload.frequency(), null));
    }
    if (payload.type() != null) {
      habit.setType(valueCodec.normalizeType(payload.type()));
    }
  }

  private void applyScheduleFields(HabitEntity habit, HabitPayloadDto payload) {
    if (payload == null) {
      habit.customDays = valueCodec.normalizeCustomDaysJson(null, jsonCodec);
      habit.schedule = null;
      habit.targetStreak = 1;
      habit.dailyTarget = valueCodec.resolveDailyTarget(null, habit.dailyTarget);
      habit.setSortOrder(valueCodec.resolveSortOrder(null, habit.sortOrderOrZero()));
      habit.reminderTime = valueCodec.normalizeReminderTime(null);
      habit.freezeDays = valueCodec.normalizeFreezeDaysJson(null, habit.freezeDays, jsonCodec);
      return;
    }

    habit.customDays = valueCodec.normalizeCustomDaysJson(payload.customDays(), jsonCodec);
    habit.schedule = jsonCodec.jsonOrNull(payload.schedule());
    habit.targetStreak = payload.targetStreak() != null ? payload.targetStreak() : 1;
    habit.dailyTarget = valueCodec.resolveDailyTarget(payload.dailyTarget(), habit.dailyTarget);
    habit.setSortOrder(valueCodec.resolveSortOrder(payload.sortOrder(), habit.sortOrderOrZero()));
    habit.reminderTime = valueCodec.normalizeReminderTime(payload.reminderTime());
    habit.reminderEnabled = payload.reminderEnabled() != null ? payload.reminderEnabled() : habit.reminderEnabled;
    habit.freezeDays = valueCodec.normalizeFreezeDaysJson(payload.freezeDays(), habit.freezeDays, jsonCodec);
  }

  private void applyMetadataFields(HabitEntity habit, HabitPayloadDto payload) {
    if (payload == null) {
      habit.tags = null;
      habit.archived = false;
      return;
    }
    habit.tags = jsonCodec.jsonOrNull(payload.tags());
    habit.archived = Boolean.TRUE.equals(payload.archived());
  }

  private void applyAuditFields(
      HabitEntity habit,
      HabitPayloadDto payload,
      Instant clientUpdated,
      SyncPayloadCodec payloadCodec
  ) {
    var version = payload == null ? null : payload.version();
    habit.version = Math.max(habit.version, version != null ? version : 0) + 1;
    habit.setUpdatedAt(payloadCodec.nextSyncDate(clientUpdated, habit.updatedAtValue()));
  }

  private String resolvedString(String rawValue, String currentValue, String defaultValue) {
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
