package com.sashplatonov.habbit.runner.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.model.SyncOpLogEntity;
import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import com.sashplatonov.habbit.runner.repository.SyncOpLogRepository;
import com.sashplatonov.habbit.runner.repository.TombstoneRepository;
import com.sashplatonov.habbit.runner.sync.dto.PullResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.PushResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class SyncRepositoryPathCoverageTest {

  private final SyncPayloadCodec payloadCodec = new SyncPayloadCodec(new ObjectMapper().findAndRegisterModules());
  private final SyncEntityMapper entityMapper = new SyncEntityMapper(payloadCodec);
  private final SyncValueCodec valueCodec = new SyncValueCodec();
  private final SyncPayloadMapper payloadMapper = new SyncPayloadMapperImpl();

  @Test
  void shouldUseRepositoriesWhenPullingEntities() {
    var habitRepository = new RepositoryPathStubHabitRepository();
    var checkinRepository = new RepositoryPathStubCheckinRepository();
    var tombstoneRepository = new RepositoryPathStubTombstoneRepository();
    var updatedAt = Instant.parse("2026-04-10T10:00:00Z");
    habitRepository.setPage(List.of(habit("habit-1", "user-1", updatedAt)));
    checkinRepository.setPage(List.of(checkin("checkin-1", "habit-1", "user-1", LocalDate.of(2026, 4, 10), updatedAt)));
    tombstoneRepository.setPage(List.of(tombstone("user-1", "habit", "habit-1", updatedAt.plusSeconds(60))));
    var processor = new SyncPullProcessor(
        payloadCodec,
        entityMapper,
        new SyncPullStore(habitRepository, checkinRepository, tombstoneRepository)
    );

    PullResponseDto response = processor.pull("user-1", "{\"updatedAt\":\"2026-04-10T10:00:00Z\",\"id\":\"cursor-1\"}");

    assertEquals("user-1", habitRepository.getLastUserId());
    assertEquals("cursor-1", habitRepository.getLastCursorId());
    assertEquals("user-1", checkinRepository.getLastUserId());
    assertEquals("cursor-1", tombstoneRepository.getLastCursorId());
    assertEquals(1, response.habits().size());
    assertEquals(1, response.checkins().size());
    assertEquals(1, response.tombstones().size());
    assertNotNull(response.nextCursor());
    assertNotNull(response.serverTime());
  }

  @Test
  void shouldUseRepositoriesWhenApplyingHabitOperations() {
    var habitRepository = new RepositoryPathStubHabitRepository();
    var checkinRepository = new RepositoryPathStubCheckinRepository();
    var tombstoneRepository = new RepositoryPathStubTombstoneRepository();
    var habitSyncStore = new HabitSyncStore(habitRepository, checkinRepository, tombstoneRepository);
    var processor = new HabitSyncProcessor(
      payloadCodec,
      payloadMapper,
      new HabitSyncDeleteHandler(payloadCodec, habitSyncStore),
      new HabitSyncUpsertHandler(
        valueCodec,
        new SyncJsonCodec(payloadCodec.objectMapper()),
        habitSyncStore
      )
    );
    var state = new SyncPushState();
    var updatedAt = Instant.parse("2026-04-10T10:00:00Z").toString();
    var upsert = SyncTestPayloads.syncOp(
        "op-habit-upsert",
        "habit",
        "upsert",
      Map.<String, Object>ofEntries(
        Map.entry("id", "habit-1"),
        Map.entry("name", "Read"),
        Map.entry("frequency", "daily"),
        Map.entry("color", "green"),
        Map.entry("icon", "book"),
        Map.entry("customDays", List.of(1, 3, 3)),
        Map.entry("targetStreak", 5),
        Map.entry("dailyTarget", 2),
        Map.entry("tags", List.of("focus", "health")),
        Map.entry("archived", true),
        Map.entry("updatedAt", updatedAt),
        Map.entry("version", 1),
        Map.entry("sortOrder", 4),
        Map.entry("reminderTime", "07:30"),
        Map.entry("reminderEnabled", true),
        Map.entry("type", "negative"),
        Map.entry("freezeDays", List.of("2026-04-10", "invalid"))
      ),
        updatedAt
    );

    processor.apply("user-1", upsert, state);

    assertEquals(1, state.applied().size());
    assertEquals(1, state.pushedHabits().size());
    assertEquals("habit-1", habitRepository.getSavedHabit().id);

    var conflictState = new SyncPushState();
    habitRepository.setExistingHabit(habit("habit-1", "other-user", Instant.parse("2026-04-10T10:01:00Z")));
    processor.apply("user-1", upsert, conflictState);
    assertEquals(1, conflictState.conflicts().size());

    var deleteState = new SyncPushState();
    var delete = SyncTestPayloads.syncOp(
        "op-habit-delete",
        "habit",
        "delete",
        Map.of("id", "habit-1", "updatedAt", updatedAt, "version", 2),
        updatedAt
    );
    processor.apply("user-1", delete, deleteState);

    assertEquals(1, deleteState.applied().size());
    assertEquals("habit-1", habitRepository.getDeletedHabitId());
    assertEquals("habit-1", checkinRepository.getDeletedByHabitId());
    assertEquals("habit-1", tombstoneRepository.getSavedTombstone().entityId);
  }

  @Test
  void shouldUseRepositoriesWhenApplyingCheckinOperations() {
    var habitRepository = new RepositoryPathStubHabitRepository();
    var checkinRepository = new RepositoryPathStubCheckinRepository();
    var tombstoneRepository = new RepositoryPathStubTombstoneRepository();
    habitRepository.setExistingHabit(habit("habit-1", "user-1", Instant.parse("2026-04-10T10:00:00Z")));
    var deleteHandler = new CheckinDeleteHandler(payloadCodec, tombstoneRepository, checkinRepository);
    var checkinSyncStore = new CheckinSyncStore(checkinRepository, habitRepository);
    var processor = new CheckinSyncProcessor(
        payloadCodec,
        payloadMapper,
      deleteHandler,
      new CheckinSyncUpsertHandler(checkinSyncStore)
    );
    var updatedAt = Instant.parse("2026-04-10T10:00:00Z").toString();

    var upsert = SyncTestPayloads.syncOp(
        "op-checkin-upsert",
        "checkin",
        "upsert",
        Map.of(
            "id", "checkin-1",
            "habitId", "habit-1",
            "date", "2026-04-10",
            "done", true,
            "count", 2,
            "updatedAt", updatedAt,
            "version", 1
        ),
        updatedAt
    );
    var upsertState = new SyncPushState();
    processor.apply("user-1", upsert, upsertState);

    assertEquals(1, upsertState.applied().size());
    assertEquals(1, upsertState.pushedCheckins().size());
    assertEquals("habit-1", checkinRepository.getSavedCheckin().habitId);

    var conflictState = new SyncPushState();
    checkinRepository.setExistingCheckin(checkin("checkin-1", "habit-1", "user-1", LocalDate.of(2026, 4, 10), Instant.parse("2026-04-10T10:05:00Z")));
    processor.apply("user-1", upsert, conflictState);
    assertEquals(1, conflictState.conflicts().size());

    var missingParentState = new SyncPushState();
    habitRepository.setExistingHabit(null);
    checkinRepository.setExistingCheckin(null);
    processor.apply("user-1", upsert, missingParentState);
    assertEquals(1, missingParentState.conflicts().size());

    habitRepository.setExistingHabit(habit("habit-1", "user-1", Instant.parse("2026-04-10T10:00:00Z")));
    var delete = SyncTestPayloads.syncOp(
        "op-checkin-delete",
        "checkin",
        "delete",
        Map.of(
            "id", "checkin-1",
            "habitId", "habit-1",
            "date", "2026-04-10",
            "updatedAt", updatedAt,
            "version", 2
        ),
        updatedAt
    );
    var deleteState = new SyncPushState();
    processor.apply("user-1", delete, deleteState);

    assertEquals(1, deleteState.applied().size());
    assertEquals("habit-1", checkinRepository.getDeletedByHabitId());
    assertEquals(LocalDate.of(2026, 4, 10), checkinRepository.getDeletedDate());
    assertEquals("checkin", tombstoneRepository.getSavedTombstone().entity);
  }

  @Test
  void shouldUseRepositoryBackedDeduplicationWhenPushingOperations() {
    var habitProcessor = new RepositoryPathCountingHabitSyncProcessor(payloadCodec, valueCodec, payloadMapper);
    var checkinProcessor = new RepositoryPathCountingCheckinSyncProcessor(payloadCodec, new CheckinDeleteHandler(payloadCodec), payloadMapper);
    var processor = new SyncPushProcessor(
        habitProcessor,
        checkinProcessor,
        new SyncPushResultFactory(payloadCodec, entityMapper),
        new RepositoryPathStubSyncOpLogRepository()
    );
    var now = Instant.parse("2026-04-10T10:00:00Z").toString();
    var habitOp = SyncTestPayloads.syncOp("op-1", "habit", "upsert", Map.of("id", "habit-1", "name", "Read", "frequency", "daily", "updatedAt", now, "version", 1), now);
    var duplicateHabitOp = SyncTestPayloads.syncOp("op-1", "habit", "upsert", Map.of("id", "habit-1", "name", "Read", "frequency", "daily", "updatedAt", now, "version", 1), now);
    var checkinOp = SyncTestPayloads.syncOp("op-2", "checkin", "upsert", Map.of("id", "checkin-1", "habitId", "habit-1", "date", "2026-04-10", "updatedAt", now, "version", 1), now);
    var unknownOp = SyncTestPayloads.syncOp("op-3", "unknown", "upsert", Map.of("id", UUID.randomUUID().toString()), now);

    PushResponseDto response = processor.push("user-1", List.of(habitOp, duplicateHabitOp, checkinOp, unknownOp));

    assertEquals(1, habitProcessor.getApplyCount());
    assertEquals(1, checkinProcessor.getApplyCount());
    assertEquals(2, response.applied().size());
    assertEquals(1, response.habits().size());
    assertEquals(1, response.checkins().size());
  }

  private HabitEntity habit(String habitId, String userId, Instant updatedAt) {
    var habit = new HabitEntity();
    habit.setId(habitId);
    habit.userId = userId;
    habit.name = "Habit";
    habit.frequency = HabitFrequency.DAILY;
    habit.color = HabitColor.BLUE;
    habit.icon = "star";
    habit.dailyTarget = 1;
    habit.targetStreak = 1;
    habit.archived = false;
    habit.type = HabitType.POSITIVE;
    habit.version = 1;
    habit.setSortOrder(BigInteger.ZERO);
    habit.setCreatedAt(updatedAt);
    habit.setUpdatedAt(updatedAt);
    return habit;
  }

  private CheckinEntity checkin(String id, String habitId, String userId, LocalDate date, Instant updatedAt) {
    var checkin = new CheckinEntity();
    checkin.id = id;
    checkin.habitId = habitId;
    checkin.userId = userId;
    checkin.setCheckinDate(date);
    checkin.done = true;
    checkin.count = 1;
    checkin.version = 1;
    checkin.setAuditTimestamps(updatedAt, updatedAt);
    return checkin;
  }

  private TombstoneEntity tombstone(String userId, String entity, String entityId, Instant deletedAt) {
    var tombstone = new TombstoneEntity();
    tombstone.id = UUID.randomUUID().toString();
    tombstone.userId = userId;
    tombstone.entity = entity;
    tombstone.entityId = entityId;
    tombstone.version = 1;
    tombstone.setDeletedAt(deletedAt);
    return tombstone;
  }
}
