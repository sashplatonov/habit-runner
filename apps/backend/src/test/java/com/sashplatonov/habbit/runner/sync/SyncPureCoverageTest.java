package com.sashplatonov.habbit.runner.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import com.sashplatonov.habbit.runner.sync.dto.PullResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.PushResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpPayloadDto;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

class SyncPureCoverageTest {

  @Test
  void shouldSerializeSyncEntities() {
    var payloadCodec = new SyncPayloadCodec(new ObjectMapper());
    var mapper = new SyncEntityMapper(payloadCodec);
    var state = new SyncPushState();
    var instant = Instant.parse("2026-04-10T08:00:00Z");

    var habit = habitEntity("habit-1", instant);
    var checkin = checkinEntity("checkin-1", habit.id, instant.plusSeconds(60));
    var tombstone = tombstoneEntity("tombstone-1", habit.id, instant.plusSeconds(120));

    var habitDto = mapper.serializeHabit(habit);
    var checkinDto = mapper.serializeCheckin(checkin);
    var tombstoneDto = mapper.serializeTombstone(tombstone);
    var conflict = SyncConflicts.newerServerValue(
      payloadCodec,
      "op-1",
      "server newer",
      SyncConflicts.serverState(7, instant)
    );
    var missingConflict = SyncConflicts.missingEntity("op-2", "missing parent");

    state.addAppliedHabit("op-habit", habit);
    state.addAppliedCheckin("op-checkin", checkin);
    state.addAppliedHabitDelete("op-delete", tombstone);
    state.addConflict(conflict);

    assertEquals("habit-1", habitDto.id());
    assertEquals("Morning Run", habitDto.name());
    assertEquals(List.of("focus", "health"), habitDto.tags());
    assertEquals("checkin-1", checkinDto.id());
    assertEquals(LocalDate.parse("2026-04-10").toString(), checkinDto.date());
    assertEquals("tombstone-1", tombstoneDto.id());
    assertEquals("habit", tombstoneDto.entity());
    assertEquals("op-1", conflict.opId());
    assertEquals(7, conflict.serverValue().version());
    assertNull(missingConflict.serverValue());
  }

  @Test
  void shouldBuildPushResponseListsAndCursor() {
    var payloadCodec = new SyncPayloadCodec(new ObjectMapper());
    var mapper = new SyncEntityMapper(payloadCodec);
    var factory = new SyncPushResultFactory(payloadCodec, mapper);
    var state = new SyncPushState();
    var instant = Instant.parse("2026-04-10T08:00:00Z");

    var habit = habitEntity("habit-1", instant);
    var checkin = checkinEntity("checkin-1", habit.id, instant.plusSeconds(60));
    var tombstone = tombstoneEntity("tombstone-1", habit.id, instant.plusSeconds(120));

    state.addAppliedHabit("op-habit", habit);
    state.addAppliedCheckin("op-checkin", checkin);
    state.addAppliedHabitDelete("op-delete", tombstone);

    var response = factory.create(state);

    var applied = response.applied();
    assertEquals(List.of("op-habit", "op-checkin", "op-delete"), applied);

    var conflicts = response.conflicts();
    assertEquals(0, conflicts.size());

    var habitsList = response.habits();
    assertEquals(1, habitsList.size());

    var checkinsList = response.checkins();
    assertEquals(1, checkinsList.size());

    var tombstonesList = response.tombstones();
    assertEquals(1, tombstonesList.size());

    var nextCursor = response.nextCursor();
    assertNotNull(nextCursor);

    var serverTime = response.serverTime();
    assertNotNull(serverTime);
  }

  @Test
  void shouldReturnNullNextCursorWhenPushResultHasNoEntities() {
    var payloadCodec = new SyncPayloadCodec(new ObjectMapper());
    var mapper = new SyncEntityMapper(payloadCodec);
    var factory = new SyncPushResultFactory(payloadCodec, mapper);

    var response = factory.create(new SyncPushState());

    assertNull(response.nextCursor());
    assertEquals(List.of(), response.applied());
  }

  @Test
  void shouldDelegateSyncServiceToUnderlyingProcessors() {
    var pullResponse = PullResponseDto.builder()
      .habits(List.of())
      .checkins(List.of())
      .tombstones(List.of())
      .nextCursor("next-cursor")
      .serverTime("2026-04-10T08:00:00Z")
      .build();
    var pushResponse = PushResponseDto.builder()
      .applied(List.of("op-1"))
      .conflicts(List.of())
      .habits(List.of())
      .checkins(List.of())
      .tombstones(List.of())
      .nextCursor(null)
      .serverTime("2026-04-10T08:00:01Z")
      .build();
    var pullProcessor = new StubSyncPullProcessor(pullResponse);
    var pushProcessor = new StubSyncPushProcessor(pushResponse);
    var service = new SyncServiceImpl(pullProcessor, pushProcessor);
    var ops = List.of(SyncOpDto.builder()
      .id("op-1")
      .entity("habit")
      .type(SyncOperationType.UPSERT)
      .payload(SyncOpPayloadDto.builder().build())
      .clientTime("2026-04-10T08:00:00Z")
      .build());

    var actualPull = service.pull("user-1", "cursor-1");
    var actualPush = service.push("user-1", ops);

    assertSame(pullResponse, actualPull);
    assertSame(pushResponse, actualPush);
    assertEquals("user-1", pullProcessor.getUserId());
    assertEquals("cursor-1", pullProcessor.getSince());
    assertEquals("user-1", pushProcessor.getUserId());
    assertEquals(ops, pushProcessor.getOps());
  }

  private HabitEntity habitEntity(String id, Instant updatedAt) {
    var habit = new HabitEntity();
    habit.id = id;
    habit.userId = "user-1";
    habit.name = "Morning Run";
    habit.description = "Track daily run";
    habit.setColor(HabitColor.LEGACY_NORD);
    habit.icon = "shoe";
    habit.setFrequency(HabitFrequency.DAILY);
    habit.customDays = "[1,2,3]";
    habit.schedule = "{\"kind\":\"daily\"}";
    habit.targetStreak = 10;
    habit.dailyTarget = 2;
    habit.tags = "[\"focus\",\"health\"]";
    habit.archived = false;
    habit.setCreatedAt(updatedAt.minusSeconds(60));
    habit.setUpdatedAt(updatedAt);
    habit.version = 4;
    habit.setSortOrder(BigInteger.valueOf(3));
    habit.reminderTime = "08:30";
    habit.reminderEnabled = true;
    habit.setType(HabitType.POSITIVE);
    habit.freezeDays = "[]";
    return habit;
  }

  private CheckinEntity checkinEntity(String id, String habitId, Instant updatedAt) {
    var checkin = new CheckinEntity();
    checkin.id = id;
    checkin.habitId = habitId;
    checkin.userId = "user-1";
    checkin.setCheckinDate(LocalDate.parse("2026-04-10"));
    checkin.done = true;
    checkin.count = 2;
    checkin.setAuditTimestamps(updatedAt.minusSeconds(60), updatedAt);
    checkin.version = 5;
    return checkin;
  }

  private TombstoneEntity tombstoneEntity(String id, String entityId, Instant deletedAt) {
    var tombstone = new TombstoneEntity();
    tombstone.id = id;
    tombstone.userId = "user-1";
    tombstone.entity = "habit";
    tombstone.entityId = entityId;
    tombstone.version = 6;
    tombstone.setDeletedAt(deletedAt);
    return tombstone;
  }
}
