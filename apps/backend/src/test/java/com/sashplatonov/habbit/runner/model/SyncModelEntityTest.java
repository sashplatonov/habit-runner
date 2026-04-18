package com.sashplatonov.habbit.runner.model;

import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SyncModelEntityTest {

  @Test
  void shouldInitializeTombstoneDefaultsWhenPrePersistRuns() {
    var tombstone = new TombstoneEntity();

    runPrePersist(tombstone);

    assertNotNull(tombstone.id);
    assertEquals(1, tombstone.version);
    assertNotNull(tombstone.deletedAt);
    assertNotNull(tombstone.createdAt);
    assertNotNull(tombstone.updatedAt);
  }

  @Test
  void shouldAlignTombstoneAuditFieldsWithExplicitDeletedAt() {
    var deletedAt = Instant.parse("2026-04-09T12:00:00Z");
    var tombstone = new TombstoneEntity();

    tombstone.setDeletedAt(deletedAt);
    runPrePersist(tombstone);

    assertEquals(deletedAt, tombstone.deletedAtValue());
    assertEquals(deletedAt, tombstone.createdAtValue());
    assertEquals(deletedAt, tombstone.updatedAtValue());
  }

  @Test
  void shouldInitializeCheckinDefaultsAndExposeAccessorsWhenPrePersistRuns() {
    var checkin = new CheckinEntity();
    checkin.count = 0;
    checkin.version = 0;
    checkin.setCheckinDate(LocalDate.of(2026, 4, 9));

    runPrePersist(checkin);

    assertNotNull(checkin.id);
    assertEquals(1, checkin.count);
    assertEquals(1, checkin.version);
    assertEquals(LocalDate.of(2026, 4, 9), checkin.syncDate());
    assertEquals(checkin.createdAt, checkin.createdAtValue());
    assertEquals(checkin.updatedAt, checkin.updatedAtValue());
    assertEquals(checkin.createdAt, checkin.updatedAt);
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

    runPrePersist(habit);

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
  void shouldPreserveExplicitUpdatedAtWhenHabitAuditUpdateRuns() {
    var createdAt = Instant.parse("2026-04-09T12:00:00Z");
    var manualUpdatedAt = Instant.parse("2026-04-09T12:05:00Z");
    var habit = new HabitEntity();

    habit.setCreatedAt(createdAt);
    runPrePersist(habit);
    habit.setUpdatedAt(manualUpdatedAt);
    habit.preUpdateAudit();

    assertEquals(createdAt, habit.createdAtValue());
    assertEquals(manualUpdatedAt, habit.updatedAtValue());
  }

  @Test
  void shouldInitializeSyncOpLogTimestampWhenPrePersistRuns() {
    var logEntity = new SyncOpLogEntity();

    logEntity.prePersistAudit();

    assertNotNull(logEntity.createdAt);
    assertNotNull(logEntity.updatedAt);
    assertEquals(logEntity.createdAt, logEntity.updatedAt);
  }

  @Test
  void shouldTouchCheckinUpdatedAtWhenAuditUpdateRunsWithoutChangingCreatedAt() {
    var createdAt = Instant.parse("2026-04-09T12:00:00Z");
    var checkin = new CheckinEntity();

    checkin.setAuditTimestamps(createdAt, createdAt);
    runPrePersist(checkin);
    checkin.done = true;
    checkin.preUpdateAudit();

    assertEquals(createdAt, checkin.createdAtValue());
    assertTrue(checkin.updatedAtValue().isAfter(createdAt));
  }

  private void runPrePersist(HabitEntity entity) {
    entity.prePersistAudit();
    entity.prePersistUuidId();
    entity.prePersist();
  }

  private void runPrePersist(CheckinEntity entity) {
    entity.prePersistAudit();
    entity.prePersistUuidId();
    entity.prePersist();
  }

  private void runPrePersist(TombstoneEntity entity) {
    entity.prePersistAudit();
    entity.prePersistUuidId();
    entity.prePersist();
  }
}
