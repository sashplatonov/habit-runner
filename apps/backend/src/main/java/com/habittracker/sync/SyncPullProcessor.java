package com.habittracker.sync;

import com.habittracker.model.CheckinEntity;
import com.habittracker.model.HabitEntity;
import com.habittracker.model.TombstoneEntity;
import com.habittracker.sync.dto.PullResponseDto;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class SyncPullProcessor {
  private final SyncPayloadCodec payloadCodec;
  private final SyncEntityMapper entityMapper;

  public SyncPullProcessor(SyncPayloadCodec payloadCodec, SyncEntityMapper entityMapper) {
    this.payloadCodec = payloadCodec;
    this.entityMapper = entityMapper;
  }

  public PullResponseDto pull(String userId, String since) {
    var cursor = payloadCodec.parseCursor(since);
    var habits = findHabits(userId, cursor);
    var checkins = findCheckins(userId, cursor);
    var tombstones = findTombstones(userId, cursor);
    var candidates = collectCursors(habits, checkins, tombstones);
    var nextCursor = payloadCodec.calculateNextCursor(candidates);

    return new PullResponseDto(
        habits.stream().map(entityMapper::serializeHabit).toList(),
        checkins.stream().map(entityMapper::serializeCheckin).toList(),
        tombstones.stream().map(entityMapper::serializeTombstone).toList(),
        nextCursor,
        payloadCodec.toSyncIso(Instant.now())
    );
  }

  protected List<HabitEntity> findHabits(String userId, SyncCursor cursor) {
    if (cursor == null) {
      return HabitEntity.<HabitEntity>find(
          "userId = ?1 ORDER BY updatedAt ASC, id ASC", userId
      ).page(0, 200).list();
    }
    return HabitEntity.<HabitEntity>find(
        "userId = ?1 AND (updatedAt > ?2 OR (updatedAt = ?2 AND id > ?3)) ORDER BY updatedAt ASC, id ASC",
        userId, cursor.updatedAt(), cursor.id()
    ).page(0, 200).list();
  }

  protected List<CheckinEntity> findCheckins(String userId, SyncCursor cursor) {
    if (cursor == null) {
      return CheckinEntity.<CheckinEntity>find(
          "userId = ?1 ORDER BY updatedAt ASC, id ASC", userId
      ).page(0, 200).list();
    }
    return CheckinEntity.<CheckinEntity>find(
        "userId = ?1 AND (updatedAt > ?2 OR (updatedAt = ?2 AND id > ?3)) ORDER BY updatedAt ASC, id ASC",
        userId, cursor.updatedAt(), cursor.id()
    ).page(0, 200).list();
  }

  protected List<TombstoneEntity> findTombstones(String userId, SyncCursor cursor) {
    if (cursor == null) {
      return TombstoneEntity.<TombstoneEntity>find(
          "userId = ?1 ORDER BY deletedAt ASC, id ASC", userId
      ).page(0, 200).list();
    }
    return TombstoneEntity.<TombstoneEntity>find(
        "userId = ?1 AND (deletedAt > ?2 OR (deletedAt = ?2 AND id > ?3)) ORDER BY deletedAt ASC, id ASC",
        userId, cursor.updatedAt(), cursor.id()
    ).page(0, 200).list();
  }

  private List<SyncCursor> collectCursors(
      List<HabitEntity> habits,
      List<CheckinEntity> checkins,
      List<TombstoneEntity> tombstones
  ) {
    var candidates = new ArrayList<SyncCursor>();
    habits.forEach(habit -> candidates.add(entityMapper.habitCursor(habit)));
    checkins.forEach(checkin -> candidates.add(entityMapper.checkinCursor(checkin)));
    tombstones.forEach(tombstone -> candidates.add(entityMapper.tombstoneCursor(tombstone)));
    return candidates;
  }
}
