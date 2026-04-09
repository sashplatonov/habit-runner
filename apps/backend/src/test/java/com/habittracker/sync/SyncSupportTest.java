package com.habittracker.sync;

import com.habittracker.model.CheckinEntity;
import com.habittracker.model.HabitEntity;
import com.habittracker.model.TombstoneEntity;
import com.habittracker.sync.dto.PushConflict;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

class SyncSupportTest {

  @Test
  void shouldResolveEntityTypeWhenRawValueKnown() {
    assertEquals(SyncEntityType.HABIT, SyncEntityType.from("habit"));
    assertEquals(SyncEntityType.CHECKIN, SyncEntityType.from(" CHECKIN "));
  }

  @Test
  void shouldReturnNullWhenEntityTypeUnknown() {
    assertNull(SyncEntityType.from("unknown"));
    assertNull(SyncEntityType.from(null));
  }

  @Test
  void shouldResolveDeleteOperationWhenRawValueDelete() {
    assertEquals(SyncOperationType.DELETE, SyncOperationType.from("delete"));
  }

  @Test
  void shouldResolveUpsertWhenOperationTypeMissingOrUnknown() {
    assertEquals(SyncOperationType.UPSERT, SyncOperationType.from(null));
    assertEquals(SyncOperationType.UPSERT, SyncOperationType.from("other"));
  }

  @Test
  void shouldTrackAppliedObjectsAndConflictsWhenPushStateMutated() {
    var state = new SyncPushState();
    var habit = new HabitEntity();
    var checkin = new CheckinEntity();
    var tombstone = new TombstoneEntity();
    var conflict = new PushConflict("op-1", "conflict", Map.of("server", "value"));

    state.addAppliedHabit("habit-op", habit);
    state.addAppliedCheckin("checkin-op", checkin);
    state.addAppliedHabitDelete("habit-delete-op", tombstone);
    state.addAppliedCheckinDelete("checkin-delete-op", tombstone);
    state.addConflict(conflict);

    assertEquals(4, state.applied().size());
    assertSame(habit, state.pushedHabits().getFirst());
    assertSame(checkin, state.pushedCheckins().getFirst());
    assertEquals(2, state.pushedTombstones().size());
    assertSame(conflict, state.conflicts().getFirst());
  }
}