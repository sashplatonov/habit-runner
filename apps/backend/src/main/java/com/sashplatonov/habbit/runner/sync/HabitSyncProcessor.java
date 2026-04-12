package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import com.sashplatonov.habbit.runner.repository.TombstoneRepository;
import com.sashplatonov.habbit.runner.sync.dto.HabitPayloadDto;
import com.sashplatonov.habbit.runner.sync.dto.PushConflict;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;

@ApplicationScoped
@Slf4j
@SuppressWarnings("PMD.CouplingBetweenObjects")
public class HabitSyncProcessor {

  private final SyncPayloadCodec payloadCodec;
  private final SyncValueCodec valueCodec;
  private final SyncEntityMapper entityMapper;
  private final SyncPayloadMapper payloadMapper;
  private final HabitRepository habitRepository;
  private final CheckinRepository checkinRepository;
  private final TombstoneRepository tombstoneRepository;

  public HabitSyncProcessor(
      SyncPayloadCodec payloadCodec,
      SyncValueCodec valueCodec,
      SyncEntityMapper entityMapper,
      SyncPayloadMapper payloadMapper
  ) {
    this(payloadCodec, valueCodec, entityMapper, payloadMapper, null, null, null);
  }

  @Inject
  @SuppressWarnings("PMD.ExcessiveParameterList")
  public HabitSyncProcessor(
      SyncPayloadCodec payloadCodec,
      SyncValueCodec valueCodec,
      SyncEntityMapper entityMapper,
      SyncPayloadMapper payloadMapper,
      HabitRepository habitRepository,
      CheckinRepository checkinRepository,
      TombstoneRepository tombstoneRepository
  ) {
    this.payloadCodec = payloadCodec;
    this.valueCodec = valueCodec;
    this.entityMapper = entityMapper;
    this.payloadMapper = payloadMapper;
    this.habitRepository = habitRepository;
    this.checkinRepository = checkinRepository;
    this.tombstoneRepository = tombstoneRepository;
  }

  public void apply(String userId, SyncOpDto op, SyncPushState state) {
    var payload = payloadMapper.toHabitPayload(op.payload());
    var habitId = valueCodec.asString(payload != null ? payload.id() : null);
    if (habitId == null) {
      log.debug("Ignoring habit sync op without habit id: opId={}", op.id());
      return;
    }
    if (op.type() == SyncOperationType.DELETE) {
      state.addAppliedHabitDelete(op.id(), deleteHabit(userId, habitId, payload));
      return;
    }

    var existing = findHabitById(habitId);
    var clientUpdated = payloadCodec.normalizeInstant(payload != null ? payload.updatedAt() : null);
    var conflict = habitConflict(userId, op.id(), existing, clientUpdated);
    if (conflict != null) {
      log.debug("Detected habit sync conflict: opId={} habitId={}", op.id(), habitId);
      state.addConflict(conflict);
      return;
    }

    var habit = ensureHabitForUpsert(existing, habitId, userId, payload);
    populateHabit(habit, payload, clientUpdated);
    if (existing == null) {
      saveHabit(habit);
    }
    state.addAppliedHabit(op.id(), habit);
  }

  private TombstoneEntity deleteHabit(String userId, String habitId, HabitPayloadDto payload) {
    var tombstone = new TombstoneEntity();
    tombstone.userId = userId;
    tombstone.entity = "habit";
    tombstone.entityId = habitId;
    tombstone.version = payload != null && payload.version() != null ? payload.version() : 1;
    tombstone.setDeletedAt(payloadCodec.nextSyncDate(
        payloadCodec.parseInstantOrNow(payload != null ? payload.updatedAt() : null)
    ));
    saveTombstone(tombstone);

    deleteCheckinsForHabit(habitId, userId);
    deleteHabit(habitId, userId);
    return tombstone;
  }

  private PushConflict habitConflict(String userId, String opId, HabitEntity existing, Instant clientUpdated) {
    if (existing == null) {
      return null;
    }
    if (!userId.equals(existing.userId)) {
      return PushConflict.builder()
          .opId(opId)
          .reason("habit belongs to another user")
          .serverValue(null)
          .build();
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
      HabitPayloadDto payload
  ) {
    if (existing != null) {
      return existing;
    }

    var habit = new HabitEntity();
    habit.id = habitId;
    habit.userId = userId;
    var createdAt = payload != null ? payload.createdAt() : null;
    habit.setCreatedAt(createdAt != null ? payloadCodec.parseInstantOrNow(createdAt) : Instant.now());
    return habit;
  }

  @SuppressWarnings({
      "PMD.CognitiveComplexity",
      "PMD.CyclomaticComplexity",
      "PMD.NPathComplexity",
      "PMD.LawOfDemeter"
  })
  private void populateHabit(HabitEntity habit, HabitPayloadDto payload, Instant clientUpdated) {
    habit.name = resolveString(payload != null ? payload.name() : null, habit.name, "Habit");
    habit.description = payload != null ? payload.description() : null;
    habit.color = valueCodec.normalizeColor(payload != null ? payload.color() : null, habit.color);
    habit.icon = resolveString(payload != null ? payload.icon() : null, habit.icon, "star");
    habit.frequency = valueCodec.normalizeFrequency(payload != null ? payload.frequency() : null, habit.frequency);
    habit.customDays = valueCodec.normalizeCustomDaysJson(payload != null ? payload.customDays() : null, payloadCodec);
    habit.schedule = payloadCodec.jsonOrNull(payload != null ? payload.schedule() : null);
    habit.targetStreak = payload != null && payload.targetStreak() != null ? payload.targetStreak() : 1;
    habit.dailyTarget = valueCodec.resolveDailyTarget(payload != null ? payload.dailyTarget() : null, habit.dailyTarget);
    habit.tags = payloadCodec.jsonOrNull(payload != null ? payload.tags() : null);
    habit.archived = payload != null && payload.archived() != null && payload.archived();
    habit.setSortOrder(valueCodec.resolveSortOrder(payload != null ? payload.sortOrder() : null, habit.sortOrderOrZero()));
    habit.reminderTime = valueCodec.normalizeReminderTime(payload != null ? payload.reminderTime() : null);
    habit.reminderEnabled = payload != null && payload.reminderEnabled() != null
        ? payload.reminderEnabled()
        : habit.reminderEnabled;
    habit.type = valueCodec.normalizeType(payload != null ? payload.type() : null);
    habit.freezeDays = valueCodec.normalizeFreezeDaysJson(payload != null ? payload.freezeDays() : null, habit.freezeDays, payloadCodec);
    habit.version = Math.max(habit.version, payload != null && payload.version() != null ? payload.version() : 0) + 1;
    habit.setUpdatedAt(payloadCodec.nextSyncDate(clientUpdated, habit.updatedAtValue()));
  }

  private String resolveString(String rawValue, String currentValue, String defaultValue) {
    var value = valueCodec.asString(rawValue);
    if (value != null) {
      return value;
    }
    if (currentValue != null) {
      return currentValue;
    }
    return defaultValue;
  }

  private HabitEntity findHabitById(String habitId) {
    return habitRepository == null ? (HabitEntity) HabitEntity.findById(habitId) : habitRepository.findHabitById(habitId);
  }

  private void saveHabit(HabitEntity habit) {
    if (habitRepository != null) {
      habitRepository.save(habit);
      return;
    }
    habit.persist();
  }

  private void saveTombstone(TombstoneEntity tombstone) {
    if (tombstoneRepository != null) {
      tombstoneRepository.save(tombstone);
      return;
    }
    tombstone.persist();
  }

  private void deleteCheckinsForHabit(String habitId, String userId) {
    if (checkinRepository != null) {
      checkinRepository.deleteByHabitIdAndUserId(habitId, userId);
      return;
    }
    CheckinEntity.delete("habitId = ?1 and userId = ?2", habitId, userId);
  }

  private void deleteHabit(String habitId, String userId) {
    if (habitRepository != null) {
      habitRepository.deleteByIdAndUserId(habitId, userId);
      return;
    }
    HabitEntity.delete("id = ?1 and userId = ?2", habitId, userId);
  }
}
