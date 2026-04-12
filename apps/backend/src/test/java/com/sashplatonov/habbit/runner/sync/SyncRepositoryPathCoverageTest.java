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

@SuppressWarnings({
  "PMD.TooManyMethods",
  "PMD.CouplingBetweenObjects",
  "PMD.LawOfDemeter",
  "PMD.ExcessiveParameterList",
  "PMD.UnusedPrivateField"
})
class SyncRepositoryPathCoverageTest {

  private final SyncPayloadCodec payloadCodec = new SyncPayloadCodec(new ObjectMapper().findAndRegisterModules());
  private final SyncEntityMapper entityMapper = new SyncEntityMapper(payloadCodec);
  private final SyncValueCodec valueCodec = new SyncValueCodec();
  private final SyncPayloadMapper payloadMapper = new SyncPayloadMapperImpl();

  @Test
  void shouldUseRepositoriesWhenPullingEntities() {
    var habitRepository = new StubHabitRepository();
    var checkinRepository = new StubCheckinRepository();
    var tombstoneRepository = new StubTombstoneRepository();
    var updatedAt = Instant.parse("2026-04-10T10:00:00Z");
    habitRepository.page = List.of(habit("habit-1", "user-1", updatedAt));
    checkinRepository.page = List.of(checkin("checkin-1", "habit-1", "user-1", LocalDate.of(2026, 4, 10), updatedAt));
    tombstoneRepository.page = List.of(tombstone("user-1", "habit", "habit-1", updatedAt.plusSeconds(60)));
    var processor = new SyncPullProcessor(payloadCodec, entityMapper, habitRepository, checkinRepository, tombstoneRepository);

    PullResponseDto response = processor.pull("user-1", "{\"updatedAt\":\"2026-04-10T10:00:00Z\",\"id\":\"cursor-1\"}");

    assertEquals("user-1", habitRepository.lastUserId);
    assertEquals("cursor-1", habitRepository.lastCursorId);
    assertEquals("user-1", checkinRepository.lastUserId);
    assertEquals("cursor-1", tombstoneRepository.lastCursorId);
    assertEquals(1, response.habits().size());
    assertEquals(1, response.checkins().size());
    assertEquals(1, response.tombstones().size());
    assertNotNull(response.nextCursor());
    assertNotNull(response.serverTime());
  }

  @Test
  void shouldUseRepositoriesWhenApplyingHabitOperations() {
    var habitRepository = new StubHabitRepository();
    var checkinRepository = new StubCheckinRepository();
    var tombstoneRepository = new StubTombstoneRepository();
    var processor = new HabitSyncProcessor(
        payloadCodec,
        valueCodec,
        entityMapper,
        payloadMapper,
        habitRepository,
        checkinRepository,
        tombstoneRepository
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
    assertEquals("habit-1", habitRepository.savedHabit.id);

    var conflictState = new SyncPushState();
    habitRepository.existingHabit = habit("habit-1", "other-user", Instant.parse("2026-04-10T10:01:00Z"));
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
    assertEquals("habit-1", habitRepository.deletedHabitId);
    assertEquals("habit-1", checkinRepository.deletedByHabitId);
    assertEquals("habit-1", tombstoneRepository.savedTombstone.entityId);
  }

  @Test
  void shouldUseRepositoriesWhenApplyingCheckinOperations() {
    var habitRepository = new StubHabitRepository();
    var checkinRepository = new StubCheckinRepository();
    var tombstoneRepository = new StubTombstoneRepository();
    habitRepository.existingHabit = habit("habit-1", "user-1", Instant.parse("2026-04-10T10:00:00Z"));
    var deleteHandler = new CheckinDeleteHandler(payloadCodec, tombstoneRepository, checkinRepository);
    var processor = new CheckinSyncProcessor(
        payloadCodec,
        entityMapper,
        deleteHandler,
        payloadMapper,
        checkinRepository,
        habitRepository
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
    assertEquals("habit-1", checkinRepository.savedCheckin.habitId);

    var conflictState = new SyncPushState();
    checkinRepository.existingCheckin = checkin("checkin-1", "habit-1", "user-1", LocalDate.of(2026, 4, 10), Instant.parse("2026-04-10T10:05:00Z"));
    processor.apply("user-1", upsert, conflictState);
    assertEquals(1, conflictState.conflicts().size());

    var missingParentState = new SyncPushState();
    habitRepository.existingHabit = null;
    checkinRepository.existingCheckin = null;
    processor.apply("user-1", upsert, missingParentState);
    assertEquals(1, missingParentState.conflicts().size());

    habitRepository.existingHabit = habit("habit-1", "user-1", Instant.parse("2026-04-10T10:00:00Z"));
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
    assertEquals("habit-1", checkinRepository.deletedByHabitId);
    assertEquals(LocalDate.of(2026, 4, 10), checkinRepository.deletedDate);
    assertEquals("checkin", tombstoneRepository.savedTombstone.entity);
  }

  @Test
  void shouldUseRepositoryBackedDeduplicationWhenPushingOperations() {
    var habitProcessor = new CountingHabitSyncProcessor(payloadCodec, valueCodec, entityMapper, payloadMapper);
    var checkinProcessor = new CountingCheckinSyncProcessor(payloadCodec, entityMapper, new CheckinDeleteHandler(payloadCodec), payloadMapper);
    var processor = new SyncPushProcessor(
        habitProcessor,
        checkinProcessor,
        new SyncPushResultFactory(payloadCodec, entityMapper),
        new StubSyncOpLogRepository()
    );
    var now = Instant.parse("2026-04-10T10:00:00Z").toString();
    var habitOp = SyncTestPayloads.syncOp("op-1", "habit", "upsert", Map.of("id", "habit-1", "name", "Read", "frequency", "daily", "updatedAt", now, "version", 1), now);
    var duplicateHabitOp = SyncTestPayloads.syncOp("op-1", "habit", "upsert", Map.of("id", "habit-1", "name", "Read", "frequency", "daily", "updatedAt", now, "version", 1), now);
    var checkinOp = SyncTestPayloads.syncOp("op-2", "checkin", "upsert", Map.of("id", "checkin-1", "habitId", "habit-1", "date", "2026-04-10", "updatedAt", now, "version", 1), now);
    var unknownOp = SyncTestPayloads.syncOp("op-3", "unknown", "upsert", Map.of("id", UUID.randomUUID().toString()), now);

    PushResponseDto response = processor.push("user-1", List.of(habitOp, duplicateHabitOp, checkinOp, unknownOp));

    assertEquals(1, habitProcessor.applyCount);
    assertEquals(1, checkinProcessor.applyCount);
    assertEquals(2, response.applied().size());
    assertEquals(1, response.habits().size());
    assertEquals(1, response.checkins().size());
  }

  private HabitEntity habit(String habitId, String userId, Instant updatedAt) {
    var habit = new HabitEntity();
    habit.id = habitId;
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

  private static final class StubHabitRepository extends HabitRepository {
    private HabitEntity existingHabit;
    private HabitEntity savedHabit;
    private String deletedHabitId;
    private String lastUserId;
    private Instant lastUpdatedAt;
    private String lastCursorId;
    private List<HabitEntity> page = List.of();

    @Override
    public HabitEntity findHabitById(String habitId) {
      return existingHabit;
    }

    @Override
    public List<HabitEntity> findPageForUser(String userId, Instant updatedAt, String cursorId, int pageSize) {
      lastUserId = userId;
      lastUpdatedAt = updatedAt;
      lastCursorId = cursorId;
      return page;
    }

    @Override
    public void save(HabitEntity entity) {
      savedHabit = entity;
      existingHabit = entity;
    }

    @Override
    public long deleteByIdAndUserId(String habitId, String userId) {
      deletedHabitId = habitId;
      return 1L;
    }
  }

  private static final class StubCheckinRepository extends CheckinRepository {
    private CheckinEntity existingCheckin;
    private CheckinEntity savedCheckin;
    private String deletedByHabitId;
    private LocalDate deletedDate;
    private String lastUserId;
    private Instant lastUpdatedAt;
    private String lastCursorId;
    private List<CheckinEntity> page = List.of();

    @Override
    public CheckinEntity findByHabitDateAndUserId(String habitId, LocalDate date, String userId) {
      return existingCheckin;
    }

    @Override
    public List<CheckinEntity> findPageForUser(String userId, Instant updatedAt, String cursorId, int pageSize) {
      lastUserId = userId;
      lastUpdatedAt = updatedAt;
      lastCursorId = cursorId;
      return page;
    }

    @Override
    public void save(CheckinEntity entity) {
      savedCheckin = entity;
      existingCheckin = entity;
    }

    @Override
    public long deleteByHabitIdAndUserId(String habitId, String userId) {
      deletedByHabitId = habitId;
      return 1L;
    }

    @Override
    public long deleteByHabitIdUserIdAndDate(String habitId, String userId, LocalDate date) {
      deletedByHabitId = habitId;
      deletedDate = date;
      return 1L;
    }
  }

  private static final class StubTombstoneRepository extends TombstoneRepository {
    private TombstoneEntity savedTombstone;
    private String lastUserId;
    private Instant lastUpdatedAt;
    private String lastCursorId;
    private List<TombstoneEntity> page = List.of();

    @Override
    public List<TombstoneEntity> findPageForUser(String userId, Instant deletedAt, String cursorId, int pageSize) {
      lastUserId = userId;
      lastUpdatedAt = deletedAt;
      lastCursorId = cursorId;
      return page;
    }

    @Override
    public void save(TombstoneEntity entity) {
      savedTombstone = entity;
    }
  }

  private static final class StubSyncOpLogRepository extends SyncOpLogRepository {
    private final Set<String> seen = new HashSet<>();

    @Override
    public boolean createIfAbsent(SyncOpLogEntity entity) {
      return seen.add(entity.opId);
    }
  }

  private static final class CountingHabitSyncProcessor extends HabitSyncProcessor {
    private int applyCount;

    CountingHabitSyncProcessor(
        SyncPayloadCodec payloadCodec,
        SyncValueCodec valueCodec,
        SyncEntityMapper entityMapper,
        SyncPayloadMapper payloadMapper
    ) {
      super(payloadCodec, valueCodec, entityMapper, payloadMapper);
    }

    @Override
    public void apply(String userId, SyncOpDto op, SyncPushState state) {
      applyCount++;
      state.addAppliedHabit(op.id(), new SyncRepositoryPathCoverageTest().habit(
          UUID.randomUUID().toString(),
          userId,
          Instant.parse("2026-04-10T10:00:00Z")
      ));
    }
  }

  private static final class CountingCheckinSyncProcessor extends CheckinSyncProcessor {
    private int applyCount;

    CountingCheckinSyncProcessor(
        SyncPayloadCodec payloadCodec,
        SyncEntityMapper entityMapper,
        CheckinDeleteHandler checkinDeleteHandler,
        SyncPayloadMapper payloadMapper
    ) {
      super(payloadCodec, entityMapper, checkinDeleteHandler, payloadMapper);
    }

    @Override
    public void apply(String userId, SyncOpDto op, SyncPushState state) {
      applyCount++;
      state.addAppliedCheckin(op.id(), new SyncRepositoryPathCoverageTest().checkin(
          UUID.randomUUID().toString(),
          "habit-1",
          userId,
          LocalDate.of(2026, 4, 10),
          Instant.parse("2026-04-10T10:00:00Z")
      ));
    }
  }
}