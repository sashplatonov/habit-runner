package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.TombstoneEntity;

import java.util.List;

final class CoordinatorTestSyncPullProcessor extends SyncPullProcessor {
  private List<HabitEntity> habits = List.of();
  private List<CheckinEntity> checkins = List.of();
  private List<TombstoneEntity> tombstones = List.of();
  private SyncCursor lastCursor;

  CoordinatorTestSyncPullProcessor(SyncPayloadCodec payloadCodec, SyncEntityMapper entityMapper) {
    super(payloadCodec, entityMapper);
  }

  void setHabits(List<HabitEntity> habits) {
    this.habits = habits;
  }

  void setCheckins(List<CheckinEntity> checkins) {
    this.checkins = checkins;
  }

  void setTombstones(List<TombstoneEntity> tombstones) {
    this.tombstones = tombstones;
  }

  SyncCursor getLastCursor() {
    return lastCursor;
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
