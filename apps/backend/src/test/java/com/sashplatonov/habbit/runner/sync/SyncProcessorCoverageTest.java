package com.sashplatonov.habbit.runner.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.model.SyncOpLogEntity;
import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import com.sashplatonov.habbit.runner.support.AuthenticatedApiTestSupport;
import com.sashplatonov.habbit.runner.sync.dto.PushResponseDto;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static com.sashplatonov.habbit.runner.sync.SyncTestPayloads.syncOp;

@QuarkusTest
@SuppressWarnings({
  "PMD.CouplingBetweenObjects",
  "PMD.ExcessiveMethodLength",
  "PMD.LawOfDemeter",
  "PMD.UnnecessaryFullyQualifiedName"
})
class SyncProcessorCoverageTest extends AuthenticatedApiTestSupport {

  private String userId;
  private SyncPayloadCodec payloadCodec;
  private SyncValueCodec valueCodec;
  private SyncEntityMapper entityMapper;
  private CheckinDeleteHandler checkinDeleteHandler;
  private HabitSyncProcessor habitSyncProcessor;
  private CheckinSyncProcessor checkinSyncProcessor;

  @BeforeEach
  void setUp() throws Exception {
    userId = createAuthenticatedUser("cloud").id();
    payloadCodec = new SyncPayloadCodec(new ObjectMapper());
    valueCodec = new SyncValueCodec();
    entityMapper = new SyncEntityMapper(payloadCodec);
    checkinDeleteHandler = new CheckinDeleteHandler(payloadCodec);
    var payloadMapper = new SyncPayloadMapperImpl();
    habitSyncProcessor = new HabitSyncProcessor(payloadCodec, valueCodec, payloadMapper);
    checkinSyncProcessor = new CheckinSyncProcessor(payloadCodec, checkinDeleteHandler, payloadMapper);
  }

  @Test
  void shouldApplyHabitUpsertAndDeleteThroughProcessor() throws Exception {
    var createdAt = Instant.parse("2026-04-10T08:00:00Z");
    var habitId = UUID.randomUUID().toString();
    var createState = new SyncPushState();
    var habitPayload = new java.util.LinkedHashMap<String, Object>();
    habitPayload.put("id", habitId);
    habitPayload.put("name", "Focus Sprint");
    habitPayload.put("description", "Deep work block");
    habitPayload.put("color", "#1F2937");
    habitPayload.put("icon", "focus");
    habitPayload.put("frequency", "custom");
    habitPayload.put("customDays", List.of(1, 3, 5));
    habitPayload.put("targetStreak", 12);
    habitPayload.put("dailyTarget", 3);
    habitPayload.put("tags", List.of("work", "focus"));
    habitPayload.put("archived", false);
    habitPayload.put("createdAt", createdAt.toString());
    habitPayload.put("updatedAt", createdAt.toString());
    habitPayload.put("version", 1);
    habitPayload.put("sortOrder", 7);
    habitPayload.put("reminderTime", "09:00");
    habitPayload.put("reminderEnabled", true);
    habitPayload.put("type", "negative");
    habitPayload.put("freezeDays", List.of("2026-04-12"));
    var createOp = syncOp("habit-create", "habit", "upsert", habitPayload, createdAt.toString());

    inTransaction(() -> habitSyncProcessor.apply(userId, createOp, createState));

    var createdHabit = HabitEntity.<HabitEntity>findById(habitId);
    assertEquals(List.of("habit-create"), createState.applied());
    assertNotNull(createdHabit);
    assertEquals("Focus Sprint", createdHabit.name);
    assertEquals(HabitType.NEGATIVE, createdHabit.type);
    assertEquals(2, createdHabit.version);

    var checkin = createCheckin(habitId, userId, LocalDate.parse("2026-04-10"), createdAt.plusSeconds(30));
    var deleteState = new SyncPushState();
    var deleteOp = syncOp(
      "habit-delete",
      "habit",
      "delete",
      Map.of(
        "id", habitId,
        "updatedAt", createdAt.plusSeconds(60).toString(),
        "version", 4
      ),
      createdAt.plusSeconds(60).toString()
    );

    inTransaction(() -> habitSyncProcessor.apply(userId, deleteOp, deleteState));

    assertEquals(List.of("habit-delete"), deleteState.applied());
    assertEquals(0L, inTransaction(() -> HabitEntity.count("id", habitId)));
    assertEquals(0L, inTransaction(() -> CheckinEntity.count("id", checkin.id)));
    assertEquals(1, deleteState.pushedTombstones().size());
  }

  @Test
  void shouldRecordHabitConflictsAndIgnoreMissingHabitId() throws Exception {
    var state = new SyncPushState();
    var instant = Instant.parse("2026-04-10T09:00:00Z");
    var foreignHabit = createHabit(UUID.randomUUID().toString(), "other-user", instant.plusSeconds(120));
    var newerHabit = createHabit(UUID.randomUUID().toString(), userId, instant.plusSeconds(180));

    inTransaction(() -> habitSyncProcessor.apply(
        userId,
        syncOp(
            "missing-id",
            "habit",
            "upsert",
            Map.of("updatedAt", instant.toString()),
            instant.toString()
        ),
        state
    ));
    inTransaction(() -> habitSyncProcessor.apply(
        userId,
        syncOp(
            "foreign-habit",
            "habit",
            "upsert",
            Map.of("id", foreignHabit.id, "updatedAt", instant.toString(), "version", 1),
            instant.toString()
        ),
        state
    ));
    inTransaction(() -> habitSyncProcessor.apply(
        userId,
        syncOp(
            "newer-habit",
            "habit",
            "upsert",
            Map.of("id", newerHabit.id, "updatedAt", instant.toString(), "version", 1),
            instant.toString()
        ),
        state
    ));

    assertTrue(state.applied().isEmpty());
    assertEquals(2, state.conflicts().size());
    assertEquals("habit belongs to another user", state.conflicts().get(0).reason());
    assertEquals("server already has newer habit", state.conflicts().get(1).reason());
  }

  @Test
  void shouldApplyCheckinUpsertDeleteAndConflictPathsThroughProcessor() throws Exception {
    var instant = Instant.parse("2026-04-10T10:00:00Z");
    var habit = createHabit(UUID.randomUUID().toString(), userId, instant.minusSeconds(120));
    var createState = new SyncPushState();
    var date = LocalDate.parse("2026-04-10");
    var createOp = syncOp(
      "checkin-create",
      "checkin",
      "upsert",
      Map.of(
        "habitId", habit.id,
        "date", date.toString(),
        "done", true,
        "count", 4,
        "version", 1,
        "updatedAt", instant.toString()
      ),
      instant.toString()
    );

    inTransaction(() -> checkinSyncProcessor.apply(userId, createOp, createState));

    var createdCheckin = CheckinEntity.<CheckinEntity>find(
        "habitId = ?1 and date = ?2 and userId = ?3",
        habit.id,
        date,
        userId
    ).firstResult();
    assertEquals(List.of("checkin-create"), createState.applied());
    assertNotNull(createdCheckin);
    assertTrue(createdCheckin.done);
    assertEquals(4, createdCheckin.count);

    var conflictState = new SyncPushState();
    createdCheckin.setUpdatedAt(instant.plusSeconds(120));
    inTransaction(() -> checkinSyncProcessor.apply(
        userId,
        syncOp(
            "checkin-conflict",
            "checkin",
            "upsert",
            Map.of(
                "habitId", habit.id,
                "date", date.toString(),
                "done", false,
                "count", 1,
                "version", 1,
                "updatedAt", instant.toString()
            ),
            instant.toString()
        ),
        conflictState
    ));
    inTransaction(() -> checkinSyncProcessor.apply(
        userId,
        syncOp(
            "missing-parent",
            "checkin",
            "upsert",
            Map.of(
                "habitId", UUID.randomUUID().toString(),
                "date", date.toString(),
                "updatedAt", instant.toString()
            ),
            instant.toString()
        ),
        conflictState
    ));

    assertEquals(2, conflictState.conflicts().size());
    assertEquals("server already has newer checkin", conflictState.conflicts().get(0).reason());
    assertEquals("checkin habit belongs to another user", conflictState.conflicts().get(1).reason());

    var deleteState = new SyncPushState();
    inTransaction(() -> checkinSyncProcessor.apply(
        userId,
        syncOp(
            "checkin-delete",
            "checkin",
            "delete",
            Map.of(
                "habitId", habit.id,
                "date", date.toString(),
                "id", createdCheckin.id,
                "version", 5,
                "updatedAt", instant.plusSeconds(240).toString()
            ),
            instant.plusSeconds(240).toString()
        ),
        deleteState
    ));

    assertEquals(List.of("checkin-delete"), deleteState.applied());
    assertEquals(0L, inTransaction(() -> CheckinEntity.count("id", createdCheckin.id)));
    assertEquals(1, deleteState.pushedTombstones().size());
  }

  @Test
  void shouldPullEntitiesUsingCursorProcessor() throws Exception {
    var instant = Instant.parse("2026-04-10T11:00:00Z");
    var habit = createHabit(UUID.randomUUID().toString(), userId, instant);
    createCheckin(habit.id, userId, LocalDate.parse("2026-04-10"), instant.plusSeconds(30));
    createTombstone(userId, habit.id, instant.plusSeconds(60));
    var pullProcessor = new SyncPullProcessor(payloadCodec, entityMapper);

    var fullResponse = inTransaction(() -> pullProcessor.pull(userId, null));
    var filteredResponse = inTransaction(() -> pullProcessor.pull(
        userId,
        "{\"updatedAt\":\"2026-04-10T11:05:00Z\",\"id\":\"zzz\"}"
    ));

    assertEquals(1, fullResponse.habits().size());
    assertEquals(1, fullResponse.checkins().size());
    assertEquals(1, fullResponse.tombstones().size());
    assertNotNull(fullResponse.nextCursor());
    assertTrue(filteredResponse.habits().isEmpty());
    assertTrue(filteredResponse.checkins().isEmpty());
    assertTrue(filteredResponse.tombstones().isEmpty());
  }

  @Test
  void shouldRoutePushOperationsThroughPushProcessor() throws Exception {
    var habitRecorder = new RecordingHabitSyncProcessor();
    var checkinRecorder = new RecordingCheckinSyncProcessor();
    var resultFactory = new RecordingResultFactory();
    var pushProcessor = new SyncPushProcessor(habitRecorder, checkinRecorder, resultFactory);
    var ops = List.of(
        syncOp(" ", "habit", "upsert", Map.of(), Instant.now().toString()),
        syncOp("habit-op", "habit", "upsert", Map.of(), Instant.now().toString()),
        syncOp("checkin-op", "checkin", "upsert", Map.of(), Instant.now().toString()),
        syncOp("unsupported-op", "unknown", "upsert", Map.of(), Instant.now().toString())
    );

    PushResponseDto response = inTransaction(() -> pushProcessor.push(userId, ops));

    assertEquals(List.of("habit-op"), habitRecorder.opIds);
    assertEquals(List.of("checkin-op"), checkinRecorder.opIds);
    assertEquals(List.of("habit-op", "checkin-op"), resultFactory.lastState.applied());
    assertEquals(3L, SyncOpLogEntity.count());
    assertEquals(List.of("habit-op", "checkin-op"), response.applied());
  }

  private HabitEntity createHabit(String habitId, String ownerId, Instant updatedAt) throws Exception {
    return inTransaction(() -> {
      var habit = new HabitEntity();
      habit.setId(habitId);
      habit.userId = ownerId;
      habit.name = "Persisted Habit";
      habit.frequency = HabitFrequency.DAILY;
      habit.color = HabitColor.LEGACY_NORD;
      habit.icon = "star";
      habit.targetStreak = 1;
      habit.dailyTarget = 1;
      habit.archived = false;
      habit.type = HabitType.POSITIVE;
      habit.freezeDays = "[]";
      habit.setSortOrder(BigInteger.ZERO);
      habit.setCreatedAt(updatedAt.minusSeconds(60));
      habit.setUpdatedAt(updatedAt);
      habit.version = 1;
      habit.persist();
      return habit;
    });
  }

  private CheckinEntity createCheckin(String habitId, String ownerId, LocalDate date, Instant updatedAt) throws Exception {
    return inTransaction(() -> {
      var checkin = new CheckinEntity();
      checkin.habitId = habitId;
      checkin.userId = ownerId;
      checkin.setCheckinDate(date);
      checkin.done = true;
      checkin.count = 1;
      checkin.setAuditTimestamps(updatedAt.minusSeconds(60), updatedAt);
      checkin.version = 1;
      checkin.persist();
      return checkin;
    });
  }

  private TombstoneEntity createTombstone(String ownerId, String entityId, Instant deletedAt) throws Exception {
    return inTransaction(() -> {
      var tombstone = new TombstoneEntity();
      tombstone.userId = ownerId;
      tombstone.entity = "habit";
      tombstone.entityId = entityId;
      tombstone.version = 1;
      tombstone.setDeletedAt(deletedAt);
      tombstone.persist();
      return tombstone;
    });
  }

  private static final class RecordingHabitSyncProcessor extends HabitSyncProcessor {
    private final List<String> opIds = new ArrayList<>();

    RecordingHabitSyncProcessor() {
      this(new SyncPayloadCodec(new ObjectMapper()));
    }

    private RecordingHabitSyncProcessor(SyncPayloadCodec payloadCodec) {
      super(payloadCodec, new SyncValueCodec(), new SyncPayloadMapperImpl());
    }

    @Override
    public void apply(String userId, com.sashplatonov.habbit.runner.sync.dto.SyncOpDto op, SyncPushState state) {
      opIds.add(op.id());
      var habit = new HabitEntity();
      habit.id = op.id() + "-habit";
      habit.userId = userId;
      habit.name = "Recorded Habit";
      habit.frequency = HabitFrequency.DAILY;
      habit.color = HabitColor.LEGACY_NORD;
      habit.icon = "star";
      habit.targetStreak = 1;
      habit.dailyTarget = 1;
      habit.archived = false;
      habit.type = HabitType.POSITIVE;
      habit.freezeDays = "[]";
      habit.version = 1;
      habit.setCreatedAt(Instant.parse("2026-04-10T12:00:00Z"));
      habit.setUpdatedAt(Instant.parse("2026-04-10T12:00:00Z"));
      state.addAppliedHabit(op.id(), habit);
    }
  }

  private static final class RecordingCheckinSyncProcessor extends CheckinSyncProcessor {
    private final List<String> opIds = new ArrayList<>();

    RecordingCheckinSyncProcessor() {
      this(new SyncPayloadCodec(new ObjectMapper()));
    }

    private RecordingCheckinSyncProcessor(SyncPayloadCodec payloadCodec) {
      super(payloadCodec, new CheckinDeleteHandler(payloadCodec), new SyncPayloadMapperImpl());
    }

    @Override
    public void apply(String userId, com.sashplatonov.habbit.runner.sync.dto.SyncOpDto op, SyncPushState state) {
      opIds.add(op.id());
      var checkin = new CheckinEntity();
      checkin.id = op.id() + "-checkin";
      checkin.habitId = "habit-1";
      checkin.userId = userId;
      checkin.setCheckinDate(LocalDate.parse("2026-04-10"));
      checkin.done = true;
      checkin.count = 1;
      checkin.version = 1;
      checkin.setAuditTimestamps(Instant.parse("2026-04-10T12:00:00Z"), Instant.parse("2026-04-10T12:00:00Z"));
      state.addAppliedCheckin(op.id(), checkin);
    }
  }

  private static final class RecordingResultFactory extends SyncPushResultFactory {
    private SyncPushState lastState;

    RecordingResultFactory() {
      super(new SyncPayloadCodec(new ObjectMapper()), new SyncEntityMapper(new SyncPayloadCodec(new ObjectMapper())));
    }

    @Override
    public com.sashplatonov.habbit.runner.sync.dto.PushResponseDto create(SyncPushState state) {
      lastState = state;
        return com.sashplatonov.habbit.runner.sync.dto.PushResponseDto.builder()
            .applied(state.applied())
            .conflicts(state.conflicts())
            .habits(List.of())
            .checkins(List.of())
            .tombstones(List.of())
            .nextCursor(null)
            .serverTime("2026-04-10T12:00:00Z")
            .build();
    }
  }
}
