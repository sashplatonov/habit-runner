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
    habit.setId(habitId);
    habit.setUserId(userId);
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

    habit.setName(resolvedString(name, habit.getName(), "Habit"));
    habit.setDescription(description);
    habit.setIcon(resolvedString(icon, habit.getIcon(), "star"));
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
      habit.setCustomDays(valueCodec.normalizeCustomDaysJson(null, jsonCodec));
      habit.setSchedule(null);
      habit.setTargetStreak(1);
      habit.setDailyTarget(valueCodec.resolveDailyTarget(null, habit.getDailyTarget()));
      habit.setSortOrder(valueCodec.resolveSortOrder(null, habit.getSortOrder() != null ? habit.getSortOrder() : java.math.BigInteger.ZERO));
      habit.setReminderTime(valueCodec.normalizeReminderTime(null));
      habit.setFreezeDays(valueCodec.normalizeFreezeDaysJson(null, habit.getFreezeDays(), jsonCodec));
      return;
    }

    habit.setCustomDays(valueCodec.normalizeCustomDaysJson(payload.customDays(), jsonCodec));
    habit.setSchedule(jsonCodec.jsonOrNull(payload.schedule()));
    habit.setTargetStreak(payload.targetStreak() != null ? payload.targetStreak() : 1);
    habit.setDailyTarget(valueCodec.resolveDailyTarget(payload.dailyTarget(), habit.getDailyTarget()));
    var resolvedSortOrder = valueCodec.resolveSortOrder(
        payload.sortOrder(), 
        habit.getSortOrder() != null ? habit.getSortOrder() : java.math.BigInteger.ZERO
    );
    habit.setSortOrder(resolvedSortOrder);
    habit.setReminderTime(valueCodec.normalizeReminderTime(payload.reminderTime()));
    habit.setReminderEnabled(payload.reminderEnabled() != null ? payload.reminderEnabled() : habit.isReminderEnabled());
    habit.setFreezeDays(valueCodec.normalizeFreezeDaysJson(payload.freezeDays(), habit.getFreezeDays(), jsonCodec));
  }

  private void applyMetadataFields(HabitEntity habit, HabitPayloadDto payload) {
    if (payload == null) {
      habit.setTags(null);
      habit.setArchived(false);
      return;
    }
    habit.setTags(jsonCodec.jsonOrNull(payload.tags()));
    habit.setArchived(Boolean.TRUE.equals(payload.archived()));
  }

  private void applyAuditFields(
      HabitEntity habit,
      HabitPayloadDto payload,
      Instant clientUpdated,
      SyncPayloadCodec payloadCodec
  ) {
    var version = payload == null ? null : payload.version();
    habit.setVersion(Math.max(habit.getVersion(), version != null ? version :0) + 1);
    habit.setUpdatedAt(payloadCodec.nextSyncDate(clientUpdated, habit.getUpdatedAt()));
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
