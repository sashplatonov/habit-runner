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

class SyncCoordinatorUnitCoverageTest {

  @Test
  void shouldAssemblePullResponseFromEntityLists() {
    var payloadCodec = new SyncPayloadCodec(new ObjectMapper());
    var mapper = new SyncEntityMapper(payloadCodec);
    var processor = new CoordinatorTestSyncPullProcessor(payloadCodec, mapper);
    processor.setHabits(List.of(habit("habit-1", Instant.parse("2026-04-10T15:00:00Z"))));
    processor.setCheckins(List.of(checkin("checkin-1", Instant.parse("2026-04-10T15:01:00Z"))));
    processor.setTombstones(List.of(tombstone("tombstone-1", Instant.parse("2026-04-10T15:02:00Z"))));

    var response = processor.pull("user-1", null);

    assertEquals(1, response.habits().size());
    assertEquals(1, response.checkins().size());
    assertEquals(1, response.tombstones().size());
    assertNotNull(response.nextCursor());
    assertNull(processor.getLastCursor());
  }

  @Test
  void shouldPassParsedCursorIntoPullQueries() {
    var payloadCodec = new SyncPayloadCodec(new ObjectMapper());
    var mapper = new SyncEntityMapper(payloadCodec);
    var processor = new CoordinatorTestSyncPullProcessor(payloadCodec, mapper);

    var response = processor.pull("user-1", "{\"updatedAt\":\"2026-04-10T15:05:00Z\",\"id\":\"cursor-1\"}");

    assertTrue(response.habits().isEmpty());
    assertNotNull(processor.getLastCursor());
    assertEquals("cursor-1", processor.getLastCursor().id());
    assertEquals(Instant.parse("2026-04-10T15:05:00Z"), processor.getLastCursor().updatedAt());
  }

  @Test
  void shouldRouteSupportedOpsAndIgnoreBlankDuplicateAndUnsupportedOnPush() {
    var habitProcessor = new CoordinatorRecordingHabitSyncProcessor();
    var checkinProcessor = new CoordinatorRecordingCheckinSyncProcessor();
    var resultFactory = new CoordinatorRecordingResultFactory();
    var processor = new CoordinatorTestSyncPushProcessor(habitProcessor, checkinProcessor, resultFactory);
    var ops = List.of(
        syncOp(" ", "habit", "upsert"),
        syncOp("habit-op", "habit", "upsert"),
        syncOp("checkin-op", "checkin", "upsert"),
        syncOp("unsupported-op", "unknown", "upsert"),
        syncOp("habit-op", "habit", "upsert")
    );

    var response = processor.push("user-1", ops);

    assertEquals(List.of("habit-op"), habitProcessor.getOpIds());
    assertEquals(List.of("checkin-op"), checkinProcessor.getOpIds());
    assertEquals(List.of("habit-op", "checkin-op"), resultFactory.getLastState().applied());
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
    habit.setId(id);
    habit.setUserId("user-1");
    habit.setName("Habit");
    habit.setColor(HabitColor.LEGACY_NORD);
    habit.setIcon("star");
    habit.setFrequency(HabitFrequency.DAILY);
    habit.setTargetStreak(1);
    habit.setDailyTarget(1);
    habit.setArchived(false);
    habit.setType(HabitType.POSITIVE);
    habit.setFreezeDays("[]");
    habit.setSortOrder(BigInteger.ZERO);
    habit.setCreatedAt(updatedAt.minusSeconds(60));
    habit.setUpdatedAt(updatedAt);
    habit.version = 1;
    return habit;
  }

  private static CheckinEntity checkin(String id, Instant updatedAt) {
    var checkin = new CheckinEntity();
    checkin.setId(id);
    checkin.setHabitId("habit-1");
    checkin.setUserId("user-1");
    checkin.setCheckinDate(LocalDate.parse("2026-04-10"));
    checkin.setDone(true);
    checkin.setCount(1);
    checkin.setAuditTimestamps(updatedAt.minusSeconds(60), updatedAt);
    checkin.setVersion(1);
    return checkin;
  }

  private static TombstoneEntity tombstone(String id, Instant deletedAt) {
    var tombstone = new TombstoneEntity();
    tombstone.setId(id);
    tombstone.setUserId("user-1");
    tombstone.setEntity("habit");
    tombstone.setEntityId("habit-1");
    tombstone.setVersion(1);
    tombstone.setDeletedAt(deletedAt);
    return tombstone;
  }
}
