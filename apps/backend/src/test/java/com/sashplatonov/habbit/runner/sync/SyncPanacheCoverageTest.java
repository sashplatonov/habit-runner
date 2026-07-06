package com.sashplatonov.habbit.runner.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.mock.PanacheMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static com.sashplatonov.habbit.runner.sync.SyncTestPayloads.syncOp;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@QuarkusTest
@Transactional
class SyncPanacheCoverageTest {

  private SyncPayloadCodec payloadCodec;
  private SyncValueCodec valueCodec;
  private SyncEntityMapper entityMapper;
  private CheckinDeleteHandler checkinDeleteHandler;
  private HabitSyncProcessor habitSyncProcessor;
  private CheckinSyncProcessor checkinSyncProcessor;

  @BeforeEach
  void setUp() {
    payloadCodec = new SyncPayloadCodec(new ObjectMapper());
    valueCodec = new SyncValueCodec();
    entityMapper = new SyncEntityMapper(payloadCodec);
    checkinDeleteHandler = new CheckinDeleteHandler(payloadCodec);
    var payloadMapper = new SyncPayloadMapperImpl();
    habitSyncProcessor = new HabitSyncProcessor(payloadCodec, valueCodec, payloadMapper);
    checkinSyncProcessor = new CheckinSyncProcessor(payloadCodec, checkinDeleteHandler, payloadMapper);
    PanacheMock.mock(HabitEntity.class);
    PanacheMock.mock(CheckinEntity.class);
    PanacheMock.mock(TombstoneEntity.class);
  }

  @Test
  void shouldApplyHabitUpsertWhenNoExistingHabitIsFound() {
    var state = new SyncPushState();
    var updatedAt = Instant.parse("2026-04-10T12:00:00Z");
    var payload = new java.util.LinkedHashMap<String, Object>();
    payload.put("id", "habit-1");
    payload.put("name", "Deep Focus");
    payload.put("description", "Focus block");
    payload.put("color", "#111827");
    payload.put("icon", "focus");
    payload.put("frequency", "daily");
    payload.put("updatedAt", updatedAt.toString());
    payload.put("createdAt", updatedAt.minusSeconds(60).toString());
    payload.put("version", 2);
    payload.put("dailyTarget", 3);
    payload.put("sortOrder", 5);
    payload.put("reminderEnabled", true);
    payload.put("type", "negative");
    var op = syncOp("habit-create", "habit", "upsert", payload, updatedAt.toString());

    habitSyncProcessor.apply("user-1", op, state);

    assertEquals(List.of("habit-create"), state.applied());
    assertEquals(1, state.pushedHabits().size());
    var habit = state.pushedHabits().getFirst();
    assertEquals("habit-1", habit.getId());
    assertEquals("user-1", habit.getUserId());
    assertEquals("Deep Focus", habit.getName());
    assertEquals(HabitType.NEGATIVE, habit.getType());
    assertEquals(BigInteger.valueOf(5), habit.sortOrderOrZero());
    assertEquals(3, habit.getVersion());
  }

  @Test
  void shouldRecordHabitConflictsForForeignOrNewerHabits() {
    var foreignHabit = habitEntity("habit-foreign", "other-user", Instant.parse("2026-04-10T12:05:00Z"), 4);
    var newerHabit = habitEntity("habit-newer", "user-1", Instant.parse("2026-04-10T12:06:00Z"), 5);
    when(HabitEntity.findById("habit-foreign")).thenReturn(foreignHabit);
    when(HabitEntity.findById("habit-newer")).thenReturn(newerHabit);
    var state = new SyncPushState();

    habitSyncProcessor.apply(
        "user-1",
        syncOp(
            "foreign-op",
            "habit",
            "upsert",
            Map.of("id", "habit-foreign", "updatedAt", "2026-04-10T12:00:00Z", "version", 1),
            "2026-04-10T12:00:00Z"
        ),
        state
    );
    habitSyncProcessor.apply(
        "user-1",
      syncOp(
            "newer-op",
            "habit",
            "upsert",
            Map.of("id", "habit-newer", "updatedAt", "2026-04-10T12:00:00Z", "version", 1),
            "2026-04-10T12:00:00Z"
        ),
        state
    );

    assertTrue(state.applied().isEmpty());
    assertEquals(2, state.conflicts().size());
    assertEquals("habit belongs to another user", state.conflicts().get(0).reason());
    assertEquals("server already has newer habit", state.conflicts().get(1).reason());
  }

  @Test
  void shouldDeleteHabitAndCreateTombstone() {
    var state = new SyncPushState();

    habitSyncProcessor.apply(
        "user-1",
      syncOp(
            "habit-delete",
            "habit",
            "delete",
            Map.of("id", "habit-1", "version", 7, "updatedAt", "2026-04-10T12:10:00Z"),
            "2026-04-10T12:10:00Z"
        ),
        state
    );

    assertEquals(List.of("habit-delete"), state.applied());
    assertEquals(1, state.pushedTombstones().size());
    var tombstone = state.pushedTombstones().getFirst();
    assertEquals("checkin".equals(tombstone.getEntity()), false);
    assertEquals("habit", tombstone.getEntity());
    assertEquals("habit-1", tombstone.getEntityId());
    assertEquals(7, tombstone.getVersion());
  }

  @Test
  void shouldApplyCheckinUpsertWhenParentHabitExists() {
    var parentHabit = habitEntity("habit-1", "user-1", Instant.parse("2026-04-10T12:00:00Z"), 2);
    when(HabitEntity.findById("habit-1")).thenReturn(parentHabit);
    when(checkinQuery("habit-1", LocalDate.parse("2026-04-10"), "user-1").firstResult()).thenReturn(null);
    var state = new SyncPushState();

    checkinSyncProcessor.apply(
        "user-1",
      syncOp(
            "checkin-create",
            "checkin",
            "upsert",
            Map.of(
                "habitId", "habit-1",
                "date", "2026-04-10",
                "done", true,
                "count", 4,
                "version", 3,
                "updatedAt", "2026-04-10T12:15:00Z"
            ),
            "2026-04-10T12:15:00Z"
        ),
        state
    );

    assertEquals(List.of("checkin-create"), state.applied());
    assertEquals(1, state.pushedCheckins().size());
    var checkin = state.pushedCheckins().getFirst();
    assertEquals("habit-1", checkin.getHabitId());
    assertTrue(checkin.getDone());
    assertEquals(4, checkin.getCount());
    assertEquals(4, checkin.getVersion());
  }

  @Test
  void shouldRecordCheckinConflictsForMissingParentAndNewerServerState() {
    var existing = checkinEntity("checkin-1", "habit-1", "user-1", LocalDate.parse("2026-04-10"), Instant.parse("2026-04-10T12:20:00Z"), 6);
    when(HabitEntity.findById("habit-1")).thenReturn(habitEntity("habit-1", "user-1", Instant.parse("2026-04-10T12:00:00Z"), 1));
    when(checkinQuery("habit-1", LocalDate.parse("2026-04-10"), "user-1").firstResult()).thenReturn(existing);
    var state = new SyncPushState();

    checkinSyncProcessor.apply(
        "user-1",
      syncOp(
            "newer-checkin",
            "checkin",
            "upsert",
            Map.of(
                "habitId", "habit-1",
                "date", "2026-04-10",
                "updatedAt", "2026-04-10T12:10:00Z",
                "version", 1
            ),
            "2026-04-10T12:10:00Z"
        ),
        state
    );
    checkinSyncProcessor.apply(
        "user-1",
      syncOp(
            "missing-parent",
            "checkin",
            "upsert",
            Map.of(
                "habitId", "missing-habit",
                "date", "2026-04-10",
                "updatedAt", "2026-04-10T12:10:00Z"
            ),
            "2026-04-10T12:10:00Z"
        ),
        state
    );

    assertTrue(state.applied().isEmpty());
    assertEquals(2, state.conflicts().size());
    assertEquals("server already has newer checkin", state.conflicts().get(0).reason());
    assertEquals("checkin habit belongs to another user", state.conflicts().get(1).reason());
  }

  @Test
  void shouldDeleteCheckinAndCreateCheckinTombstone() {
    var parentHabit = habitEntity("habit-1", "user-1", Instant.parse("2026-04-10T12:00:00Z"), 1);
    var existing = checkinEntity("checkin-1", "habit-1", "user-1", LocalDate.parse("2026-04-10"), Instant.parse("2026-04-10T12:20:00Z"), 6);
    when(HabitEntity.findById("habit-1")).thenReturn(parentHabit);
    when(checkinQuery("habit-1", LocalDate.parse("2026-04-10"), "user-1").firstResult()).thenReturn(existing);
    var state = new SyncPushState();

    checkinSyncProcessor.apply(
        "user-1",
      syncOp(
            "checkin-delete",
            "checkin",
            "delete",
            Map.of(
                "id", "checkin-1",
                "habitId", "habit-1",
                "date", "2026-04-10",
                "updatedAt", "2026-04-10T12:25:00Z",
                "version", 8
            ),
            "2026-04-10T12:25:00Z"
        ),
        state
    );

    assertEquals(List.of("checkin-delete"), state.applied());
    assertEquals(1, state.pushedTombstones().size());
    var tombstone = state.pushedTombstones().getFirst();
    assertEquals("checkin", tombstone.entity);
    assertEquals("checkin-1", tombstone.entityId);
    assertEquals(8, tombstone.version);
  }

  @Test
  void shouldPullEntitiesWithAndWithoutCursor() {
    var habit = habitEntity("habit-1", "user-1", Instant.parse("2026-04-10T12:30:00Z"), 2);
    var checkin = checkinEntity("checkin-1", "habit-1", "user-1", LocalDate.parse("2026-04-10"), Instant.parse("2026-04-10T12:31:00Z"), 3);
    var tombstone = tombstoneEntity("tombstone-1", "user-1", "habit-1", Instant.parse("2026-04-10T12:32:00Z"), 4);
    when(habitPageQuery("user-1").list()).thenReturn(List.of(habit));
    when(checkinPageQuery("user-1").list()).thenReturn(List.of(checkin));
    when(tombstonePageQuery("user-1").list()).thenReturn(List.of(tombstone));
    when(habitCursorQuery("user-1", Instant.parse("2026-04-10T12:40:00Z"), "zzz").list()).thenReturn(List.of());
    when(checkinCursorQuery("user-1", Instant.parse("2026-04-10T12:40:00Z"), "zzz").list()).thenReturn(List.of());
    when(tombstoneCursorQuery("user-1", Instant.parse("2026-04-10T12:40:00Z"), "zzz").list()).thenReturn(List.of());
    var pullProcessor = new SyncPullProcessor(payloadCodec, entityMapper);

    var fullResponse = pullProcessor.pull("user-1", null);
    var filteredResponse = pullProcessor.pull("user-1", "{\"updatedAt\":\"2026-04-10T12:40:00Z\",\"id\":\"zzz\"}");

    assertEquals(1, fullResponse.habits().size());
    assertEquals(1, fullResponse.checkins().size());
    assertEquals(1, fullResponse.tombstones().size());
    assertNotNull(fullResponse.nextCursor());
    assertTrue(filteredResponse.habits().isEmpty());
    assertTrue(filteredResponse.checkins().isEmpty());
    assertTrue(filteredResponse.tombstones().isEmpty());
  }

  private HabitEntity habitEntity(String id, String userId, Instant updatedAt, int version) {
    var habit = new HabitEntity();
    habit.id = id;
    habit.userId = userId;
    habit.name = "Habit";
    habit.color = HabitColor.LEGACY_NORD;
    habit.icon = "star";
    habit.frequency = HabitFrequency.DAILY;
    habit.targetStreak = 1;
    habit.dailyTarget = 1;
    habit.archived = false;
    habit.type = HabitType.POSITIVE;
    habit.freezeDays = "[]";
    habit.setSortOrder(BigInteger.ZERO);
    habit.setCreatedAt(updatedAt.minusSeconds(60));
    habit.setUpdatedAt(updatedAt);
    habit.version = version;
    return habit;
  }

  private CheckinEntity checkinEntity(
      String id,
      String habitId,
      String userId,
      LocalDate date,
      Instant updatedAt,
      int version
  ) {
    var checkin = new CheckinEntity();
    checkin.id = id;
    checkin.habitId = habitId;
    checkin.userId = userId;
    checkin.setCheckinDate(date);
    checkin.done = true;
    checkin.count = 2;
    checkin.setAuditTimestamps(updatedAt.minusSeconds(60), updatedAt);
    checkin.version = version;
    return checkin;
  }

  private TombstoneEntity tombstoneEntity(String id, String userId, String entityId, Instant deletedAt, int version) {
    var tombstone = new TombstoneEntity();
    tombstone.id = id;
    tombstone.userId = userId;
    tombstone.entity = "habit";
    tombstone.entityId = entityId;
    tombstone.version = version;
    tombstone.setDeletedAt(deletedAt);
    return tombstone;
  }

  private PanacheQuery<CheckinEntity> checkinQuery(String habitId, LocalDate date, String userId) {
    var query = mock(PanacheQuery.class);
    when(CheckinEntity.find("habitId = ?1 and date = ?2 and userId = ?3", habitId, date, userId)).thenReturn(query);
    return query;
  }

  private PanacheQuery<HabitEntity> habitPageQuery(String userId) {
    var query = mock(PanacheQuery.class);
    when(HabitEntity.find("userId = ?1 ORDER BY updatedAt ASC, id ASC", userId)).thenReturn(query);
    when(query.page(0, 200)).thenReturn(query);
    return query;
  }

  private PanacheQuery<CheckinEntity> checkinPageQuery(String userId) {
    var query = mock(PanacheQuery.class);
    when(CheckinEntity.find("userId = ?1 ORDER BY updatedAt ASC, id ASC", userId)).thenReturn(query);
    when(query.page(0, 200)).thenReturn(query);
    return query;
  }

  private PanacheQuery<TombstoneEntity> tombstonePageQuery(String userId) {
    var query = mock(PanacheQuery.class);
    when(TombstoneEntity.find("userId = ?1 ORDER BY deletedAt ASC, id ASC", userId)).thenReturn(query);
    when(query.page(0, 200)).thenReturn(query);
    return query;
  }

  private PanacheQuery<HabitEntity> habitCursorQuery(String userId, Instant updatedAt, String id) {
    var query = mock(PanacheQuery.class);
    when(HabitEntity.find(
        "userId = ?1 AND (updatedAt > ?2 OR (updatedAt = ?2 AND id > ?3)) ORDER BY updatedAt ASC, id ASC",
        userId,
        updatedAt,
        id
    )).thenReturn(query);
    when(query.page(0, 200)).thenReturn(query);
    return query;
  }

  private PanacheQuery<CheckinEntity> checkinCursorQuery(String userId, Instant updatedAt, String id) {
    var query = mock(PanacheQuery.class);
    when(CheckinEntity.find(
        "userId = ?1 AND (updatedAt > ?2 OR (updatedAt = ?2 AND id > ?3)) ORDER BY updatedAt ASC, id ASC",
        userId,
        updatedAt,
        id
    )).thenReturn(query);
    when(query.page(0, 200)).thenReturn(query);
    return query;
  }

  private PanacheQuery<TombstoneEntity> tombstoneCursorQuery(String userId, Instant deletedAt, String id) {
    var query = mock(PanacheQuery.class);
    when(TombstoneEntity.find(
        "userId = ?1 AND (deletedAt > ?2 OR (deletedAt = ?2 AND id > ?3)) ORDER BY deletedAt ASC, id ASC",
        userId,
        deletedAt,
        id
    )).thenReturn(query);
    when(query.page(0, 200)).thenReturn(query);
    return query;
  }
}
