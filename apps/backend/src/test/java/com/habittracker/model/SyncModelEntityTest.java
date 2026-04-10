package com.habittracker.model;

import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class SyncModelEntityTest {

  @Test
  void shouldInitializeTombstoneDefaultsWhenPrePersistRuns() {
    var tombstone = new TombstoneEntity();

    tombstone.prePersist();

    assertNotNull(tombstone.id);
    assertEquals(1, tombstone.version);
    assertNotNull(tombstone.deletedAt);
  }

  @Test
  void shouldInitializeCheckinDefaultsAndExposeAccessorsWhenPrePersistRuns() {
    var checkin = new CheckinEntity();
    checkin.count = 0;
    checkin.version = 0;
    checkin.setCheckinDate(LocalDate.of(2026, 4, 9));

    checkin.prePersist();

    assertNotNull(checkin.id);
    assertEquals(1, checkin.count);
    assertEquals(1, checkin.version);
    assertEquals(LocalDate.of(2026, 4, 9), checkin.syncDate());
    assertEquals(checkin.createdAt, checkin.createdAtValue());
    assertEquals(checkin.updatedAt, checkin.updatedAtValue());
  }

  @Test
  void shouldUpdateCheckinAuditFieldsWhenSettersCalled() {
    var createdAt = Instant.parse("2026-04-09T12:00:00Z");
    var updatedAt = Instant.parse("2026-04-09T12:05:00Z");
    var checkin = new CheckinEntity();

    checkin.setAuditTimestamps(createdAt, updatedAt);
    checkin.setUpdatedAt(updatedAt.plusSeconds(5));

    assertEquals(createdAt, checkin.createdAtValue());
    assertEquals(updatedAt.plusSeconds(5), checkin.updatedAtValue());
  }

  @Test
  void shouldInitializeHabitDefaultsAndExposeAccessorsWhenPrePersistRuns() {
    var habit = new HabitEntity();
    habit.dailyTarget = 0;
    habit.version = 0;

    habit.prePersist();

    assertNotNull(habit.id);
    assertEquals(1, habit.dailyTarget);
    assertEquals(BigInteger.ZERO, habit.sortOrderOrZero());
    assertEquals(HabitType.POSITIVE, habit.type);
    assertEquals("[]", habit.freezeDays);
    assertEquals(1, habit.versionValue());
    assertEquals(habit.createdAt, habit.createdAtValue());
    assertEquals(habit.updatedAt, habit.updatedAtValue());
  }

  @Test
  void shouldInitializeSyncOpLogTimestampWhenPrePersistRuns() {
    var logEntity = new SyncOpLogEntity();

    logEntity.prePersist();

    assertNotNull(logEntity.createdAt);
  }
}