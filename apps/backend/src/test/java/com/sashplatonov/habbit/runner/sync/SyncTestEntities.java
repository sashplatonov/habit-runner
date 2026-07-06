package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;

final class SyncTestEntities {
  private SyncTestEntities() {
  }

  static HabitEntity coordinatorHabit(String id, Instant updatedAt) {
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

  static CheckinEntity coordinatorCheckin(String id, Instant updatedAt) {
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

  static HabitEntity processorHabit(String id, String userId, Instant updatedAt) {
    var habit = new HabitEntity();
    habit.id = id;
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
    habit.setCreatedAt(updatedAt);
    habit.setUpdatedAt(updatedAt);
    return habit;
  }

  static CheckinEntity processorCheckin(String id, String userId, LocalDate date, Instant updatedAt) {
    var checkin = new CheckinEntity();
    checkin.id = id;
    checkin.habitId = "habit-1";
    checkin.userId = userId;
    checkin.setCheckinDate(date);
    checkin.done = true;
    checkin.count = 1;
    checkin.version = 1;
    checkin.setAuditTimestamps(updatedAt, updatedAt);
    return checkin;
  }

  static HabitEntity repositoryPathHabit(String habitId, String userId, Instant updatedAt) {
    var habit = new HabitEntity();
    habit.setId(habitId);
    habit.userId = userId;
    habit.name = "Habit";
    habit.frequency = HabitFrequency.DAILY;
    habit.color = HabitColor.BLUE;
    habit.icon = "star";
    habit.dailyTarget = 1;
    habit.targetStreak = 1;
    habit.archived = false;
    habit.type = HabitType.POSITIVE;
    habit.version = 1;
    habit.setSortOrder(BigInteger.ZERO);
    habit.setCreatedAt(updatedAt);
    habit.setUpdatedAt(updatedAt);
    return habit;
  }

  static CheckinEntity repositoryPathCheckin(String id, String habitId, String userId, LocalDate date, Instant updatedAt) {
    var checkin = new CheckinEntity();
    checkin.id = id;
    checkin.habitId = habitId;
    checkin.userId = userId;
    checkin.setCheckinDate(date);
    checkin.done = true;
    checkin.count = 1;
    checkin.version = 1;
    checkin.setAuditTimestamps(updatedAt, updatedAt);
    return checkin;
  }
}
