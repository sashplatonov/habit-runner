package com.habittracker.sync;

import com.habittracker.model.CheckinEntity;
import com.habittracker.model.HabitEntity;
import com.habittracker.model.TombstoneEntity;
import com.habittracker.sync.dto.PushConflict;

import java.util.ArrayList;
import java.util.List;

final class SyncPushState {
  private final List<String> applied = new ArrayList<>();
  private final List<PushConflict> conflicts = new ArrayList<>();
  private final List<HabitEntity> pushedHabits = new ArrayList<>();
  private final List<CheckinEntity> pushedCheckins = new ArrayList<>();
  private final List<TombstoneEntity> pushedTombstones = new ArrayList<>();

  void addAppliedHabit(String opId, HabitEntity habit) {
    applied.add(opId);
    pushedHabits.add(habit);
  }

  void addAppliedHabitDelete(String opId, TombstoneEntity tombstone) {
    applied.add(opId);
    pushedTombstones.add(tombstone);
  }

  void addAppliedCheckin(String opId, CheckinEntity checkin) {
    applied.add(opId);
    pushedCheckins.add(checkin);
  }

  void addAppliedCheckinDelete(String opId, TombstoneEntity tombstone) {
    applied.add(opId);
    pushedTombstones.add(tombstone);
  }

  void addConflict(PushConflict conflict) {
    conflicts.add(conflict);
  }

  List<String> applied() {
    return applied;
  }

  List<PushConflict> conflicts() {
    return conflicts;
  }

  List<HabitEntity> pushedHabits() {
    return pushedHabits;
  }

  List<CheckinEntity> pushedCheckins() {
    return pushedCheckins;
  }

  List<TombstoneEntity> pushedTombstones() {
    return pushedTombstones;
  }
}
