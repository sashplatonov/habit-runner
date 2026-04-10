package com.habittracker.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.habittracker.model.CheckinEntity;
import com.habittracker.model.HabitEntity;
import com.habittracker.model.TombstoneEntity;
import com.habittracker.sync.dto.PullResponseDto;
import com.habittracker.sync.dto.PushResponseDto;
import com.habittracker.sync.dto.SyncOpDto;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

class SyncPureCoverageTest {

  @Test
  void shouldSerializeSyncEntitiesAndBuildPushResponse() {
    var payloadCodec = new SyncPayloadCodec(new ObjectMapper());
    var mapper = new SyncEntityMapper(payloadCodec);
    var factory = new SyncPushResultFactory(payloadCodec, mapper);
    var state = new SyncPushState();
    var instant = Instant.parse("2026-04-10T08:00:00Z");

    var habit = habitEntity("habit-1", instant);
    var checkin = checkinEntity("checkin-1", habit.id, instant.plusSeconds(60));
    var tombstone = tombstoneEntity("tombstone-1", habit.id, instant.plusSeconds(120));

    var habitDto = mapper.serializeHabit(habit);
    var checkinDto = mapper.serializeCheckin(checkin);
    var tombstoneDto = mapper.serializeTombstone(tombstone);
    var conflict = mapper.buildConflict("op-1", "server newer", 7, instant);
    var missingConflict = mapper.buildMissingEntityConflict("op-2", "missing parent");

    state.addAppliedHabit("op-habit", habit);
    state.addAppliedCheckin("op-checkin", checkin);
    state.addAppliedHabitDelete("op-delete", tombstone);
    state.addConflict(conflict);

    var response = factory.create(state);

    assertEquals("habit-1", habitDto.id());
    assertEquals("Morning Run", habitDto.name());
    assertEquals(List.of("focus", "health"), habitDto.tags());
    assertEquals("checkin-1", checkinDto.id());
    assertEquals(LocalDate.parse("2026-04-10").toString(), checkinDto.date());
    assertEquals("tombstone-1", tombstoneDto.id());
    assertEquals("habit", tombstoneDto.entity());
    assertEquals("op-1", conflict.opId());
    assertEquals(7, conflict.serverValue().get("version"));
    assertNull(missingConflict.serverValue());
    assertEquals(List.of("op-habit", "op-checkin", "op-delete"), response.applied());
    assertEquals(1, response.conflicts().size());
    assertEquals(1, response.habits().size());
    assertEquals(1, response.checkins().size());
    assertEquals(1, response.tombstones().size());
    assertNotNull(response.nextCursor());
    assertNotNull(response.serverTime());
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
    var pullResponse = new PullResponseDto(List.of(), List.of(), List.of(), "next-cursor", "2026-04-10T08:00:00Z");
    var pushResponse = new PushResponseDto(List.of("op-1"), List.of(), List.of(), List.of(), List.of(), null, "2026-04-10T08:00:01Z");
    var pullProcessor = new StubSyncPullProcessor(pullResponse);
    var pushProcessor = new StubSyncPushProcessor(pushResponse);
    var service = new SyncService(pullProcessor, pushProcessor);
    var ops = List.of(new SyncOpDto("op-1", "habit", "upsert", Map.of(), "2026-04-10T08:00:00Z"));

    var actualPull = service.pull("user-1", "cursor-1");
    var actualPush = service.push("user-1", ops);

    assertSame(pullResponse, actualPull);
    assertSame(pushResponse, actualPush);
    assertEquals("user-1", pullProcessor.userId);
    assertEquals("cursor-1", pullProcessor.since);
    assertEquals("user-1", pushProcessor.userId);
    assertEquals(ops, pushProcessor.ops);
  }

  private HabitEntity habitEntity(String id, Instant updatedAt) {
    var habit = new HabitEntity();
    habit.id = id;
    habit.userId = "user-1";
    habit.name = "Morning Run";
    habit.description = "Track daily run";
    habit.color = "#5E81AC";
    habit.icon = "shoe";
    habit.frequency = "daily";
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
    habit.type = "positive";
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

  private static final class StubSyncPullProcessor extends SyncPullProcessor {
    private final PullResponseDto response;
    private String userId;
    private String since;

    StubSyncPullProcessor(PullResponseDto response) {
      super(null, null);
      this.response = response;
    }

    @Override
    public PullResponseDto pull(String userId, String since) {
      this.userId = userId;
      this.since = since;
      return response;
    }
  }

  private static final class StubSyncPushProcessor extends SyncPushProcessor {
    private final PushResponseDto response;
    private String userId;
    private List<SyncOpDto> ops;

    StubSyncPushProcessor(PushResponseDto response) {
      super(null, null, null);
      this.response = response;
    }

    @Override
    public PushResponseDto push(String userId, List<SyncOpDto> ops) {
      this.userId = userId;
      this.ops = ops;
      return response;
    }
  }
}