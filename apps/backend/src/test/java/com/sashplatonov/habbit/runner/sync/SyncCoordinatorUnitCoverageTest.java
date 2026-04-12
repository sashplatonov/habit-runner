package com.sashplatonov.habbit.runner.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import com.sashplatonov.habbit.runner.sync.dto.CheckinDto;
import com.sashplatonov.habbit.runner.sync.dto.HabitDto;
import com.sashplatonov.habbit.runner.sync.dto.PushResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpPayloadDto;
import com.sashplatonov.habbit.runner.sync.dto.TombstoneDto;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SuppressWarnings({"PMD.CouplingBetweenObjects", "PMD.LawOfDemeter"})
class SyncCoordinatorUnitCoverageTest {

  @Test
  void shouldAssemblePullResponseFromEntityLists() {
    var payloadCodec = new SyncPayloadCodec(new ObjectMapper());
    var mapper = new SyncEntityMapper(payloadCodec);
    var processor = new TestSyncPullProcessor(payloadCodec, mapper);
    processor.habits = List.of(habit("habit-1", Instant.parse("2026-04-10T15:00:00Z")));
    processor.checkins = List.of(checkin("checkin-1", Instant.parse("2026-04-10T15:01:00Z")));
    processor.tombstones = List.of(tombstone("tombstone-1", Instant.parse("2026-04-10T15:02:00Z")));

    var response = processor.pull("user-1", null);

    assertEquals(1, response.habits().size());
    assertEquals(1, response.checkins().size());
    assertEquals(1, response.tombstones().size());
    assertNotNull(response.nextCursor());
    assertNull(processor.lastCursor);
  }

  @Test
  void shouldPassParsedCursorIntoPullQueries() {
    var payloadCodec = new SyncPayloadCodec(new ObjectMapper());
    var mapper = new SyncEntityMapper(payloadCodec);
    var processor = new TestSyncPullProcessor(payloadCodec, mapper);

    var response = processor.pull("user-1", "{\"updatedAt\":\"2026-04-10T15:05:00Z\",\"id\":\"cursor-1\"}");

    assertTrue(response.habits().isEmpty());
    assertNotNull(processor.lastCursor);
    assertEquals("cursor-1", processor.lastCursor.id());
    assertEquals(Instant.parse("2026-04-10T15:05:00Z"), processor.lastCursor.updatedAt());
  }

  @Test
  void shouldRouteSupportedOpsAndIgnoreBlankDuplicateAndUnsupportedOnPush() {
    var habitProcessor = new RecordingHabitSyncProcessor();
    var checkinProcessor = new RecordingCheckinSyncProcessor();
    var resultFactory = new RecordingResultFactory();
    var processor = new TestSyncPushProcessor(habitProcessor, checkinProcessor, resultFactory);
    var ops = List.of(
        syncOp(" ", "habit", "upsert"),
        syncOp("habit-op", "habit", "upsert"),
        syncOp("checkin-op", "checkin", "upsert"),
        syncOp("unsupported-op", "unknown", "upsert"),
        syncOp("habit-op", "habit", "upsert")
    );

    var response = processor.push("user-1", ops);

    assertEquals(List.of("habit-op"), habitProcessor.opIds);
    assertEquals(List.of("checkin-op"), checkinProcessor.opIds);
    assertEquals(List.of("habit-op", "checkin-op"), resultFactory.lastState.applied());
    assertEquals(List.of("habit-op", "checkin-op"), response.applied());
  }

  private SyncOpDto syncOp(String id, String entity, String type) {
    return SyncOpDto.builder()
        .id(id)
        .entity(entity)
      .type(SyncOperationType.from(type))
        .payload(SyncOpPayloadDto.builder().build())
        .clientTime(Instant.now().toString())
        .build();
  }

  private static HabitEntity habit(String id, Instant updatedAt) {
    var habit = new HabitEntity();
    habit.id = id;
    habit.userId = "user-1";
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
    habit.version = 1;
    return habit;
  }

  private static CheckinEntity checkin(String id, Instant updatedAt) {
    var checkin = new CheckinEntity();
    checkin.id = id;
    checkin.habitId = "habit-1";
    checkin.userId = "user-1";
    checkin.setCheckinDate(LocalDate.parse("2026-04-10"));
    checkin.done = true;
    checkin.count = 1;
    checkin.setAuditTimestamps(updatedAt.minusSeconds(60), updatedAt);
    checkin.version = 1;
    return checkin;
  }

  private static TombstoneEntity tombstone(String id, Instant deletedAt) {
    var tombstone = new TombstoneEntity();
    tombstone.id = id;
    tombstone.userId = "user-1";
    tombstone.entity = "habit";
    tombstone.entityId = "habit-1";
    tombstone.version = 1;
    tombstone.setDeletedAt(deletedAt);
    return tombstone;
  }

  private static final class TestSyncPullProcessor extends SyncPullProcessor {
    private List<HabitEntity> habits = List.of();
    private List<CheckinEntity> checkins = List.of();
    private List<TombstoneEntity> tombstones = List.of();
    private SyncCursor lastCursor;

    TestSyncPullProcessor(SyncPayloadCodec payloadCodec, SyncEntityMapper entityMapper) {
      super(payloadCodec, entityMapper);
    }

    @Override
    protected List<HabitEntity> findHabits(String userId, SyncCursor cursor) {
      lastCursor = cursor;
      return habits;
    }

    @Override
    protected List<CheckinEntity> findCheckins(String userId, SyncCursor cursor) {
      lastCursor = cursor;
      return checkins;
    }

    @Override
    protected List<TombstoneEntity> findTombstones(String userId, SyncCursor cursor) {
      lastCursor = cursor;
      return tombstones;
    }
  }

  private static final class TestSyncPushProcessor extends SyncPushProcessor {
    private final java.util.Set<String> seenOpIds = new java.util.HashSet<>();

    TestSyncPushProcessor(
        HabitSyncProcessor habitSyncProcessor,
        CheckinSyncProcessor checkinSyncProcessor,
        SyncPushResultFactory resultFactory
    ) {
      super(habitSyncProcessor, checkinSyncProcessor, resultFactory);
    }

    @Override
    protected boolean tryCreateLog(String opId) {
      return seenOpIds.add(opId);
    }
  }

  private static final class RecordingHabitSyncProcessor extends HabitSyncProcessor {
    private final List<String> opIds = new ArrayList<>();

    RecordingHabitSyncProcessor() {
      super(null, null, null, null);
    }

    @Override
    public void apply(String userId, SyncOpDto op, SyncPushState state) {
      opIds.add(op.id());
      state.addAppliedHabit(op.id(), habit(op.id() + "-habit", Instant.parse("2026-04-10T15:10:00Z")));
    }
  }

  private static final class RecordingCheckinSyncProcessor extends CheckinSyncProcessor {
    private final List<String> opIds = new ArrayList<>();

    RecordingCheckinSyncProcessor() {
      super(null, null, null, null);
    }

    @Override
    public void apply(String userId, SyncOpDto op, SyncPushState state) {
      opIds.add(op.id());
      state.addAppliedCheckin(op.id(), checkin(op.id() + "-checkin", Instant.parse("2026-04-10T15:11:00Z")));
    }
  }

  private static final class RecordingResultFactory extends SyncPushResultFactory {
    private SyncPushState lastState;

    RecordingResultFactory() {
      super(new SyncPayloadCodec(new ObjectMapper()), new SyncEntityMapper(new SyncPayloadCodec(new ObjectMapper())));
    }

    @Override
    public PushResponseDto create(SyncPushState state) {
      lastState = state;
      return PushResponseDto.builder()
          .applied(state.applied())
          .conflicts(state.conflicts())
          .habits(List.of(HabitDto.builder()
              .id("habit-1")
              .name("Habit")
              .description("")
              .color(HabitColor.LEGACY_NORD)
              .icon("star")
              .frequency(HabitFrequency.DAILY)
              .customDays(null)
              .schedule(null)
              .targetStreak(1)
              .dailyTarget(1)
              .tags(List.of())
              .archived(false)
              .createdAt("2026-04-10T15:00:00Z")
              .updatedAt("2026-04-10T15:00:00Z")
              .version(1)
              .sortOrder(0)
              .reminderTime(null)
              .reminderEnabled(false)
              .type(HabitType.POSITIVE)
              .freezeDays(List.of())
              .build()))
          .checkins(List.of(CheckinDto.builder()
              .id("checkin-1")
              .habitId("habit-1")
              .date("2026-04-10")
              .done(true)
              .count(1)
              .updatedAt("2026-04-10T15:00:00Z")
              .version(1)
              .build()))
          .tombstones(List.of(TombstoneDto.builder()
              .id("tombstone-1")
              .entity("habit")
              .entityId("habit-1")
              .deletedAt("2026-04-10T15:00:00Z")
              .version(1)
              .build()))
          .nextCursor(null)
          .serverTime("2026-04-10T15:00:00Z")
          .build();
    }
  }
}