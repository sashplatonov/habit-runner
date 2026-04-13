package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import com.sashplatonov.habbit.runner.sync.dto.PullResponseDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class SyncPullProcessor {
  private final SyncPayloadCodec payloadCodec;
  private final SyncEntityMapper entityMapper;
  private final SyncPullStore syncPullStore;

  public SyncPullProcessor(SyncPayloadCodec payloadCodec, SyncEntityMapper entityMapper) {
    this(payloadCodec, entityMapper, new SyncPullStore());
  }

  @Inject
  public SyncPullProcessor(
      SyncPayloadCodec payloadCodec,
      SyncEntityMapper entityMapper,
      SyncPullStore syncPullStore
  ) {
    this.payloadCodec = payloadCodec;
    this.entityMapper = entityMapper;
    this.syncPullStore = syncPullStore;
  }

  public PullResponseDto pull(String userId, String since) {
    var cursor = payloadCodec.parseCursor(since);
    var habits = findHabits(userId, cursor);
    var checkins = findCheckins(userId, cursor);
    var tombstones = findTombstones(userId, cursor);
    var candidates = collectCursors(habits, checkins, tombstones);
    var nextCursor = payloadCodec.calculateNextCursor(candidates);

    return PullResponseDto.builder()
        .habits(habits.stream().map(entityMapper::serializeHabit).toList())
        .checkins(checkins.stream().map(entityMapper::serializeCheckin).toList())
        .tombstones(tombstones.stream().map(entityMapper::serializeTombstone).toList())
        .nextCursor(nextCursor)
        .serverTime(payloadCodec.toSyncIso(Instant.now()))
        .build();
  }

  protected List<HabitEntity> findHabits(String userId, SyncCursor cursor) {
    return syncPullStore.findHabits(userId, cursor);
  }

  protected List<CheckinEntity> findCheckins(String userId, SyncCursor cursor) {
    return syncPullStore.findCheckins(userId, cursor);
  }

  protected List<TombstoneEntity> findTombstones(String userId, SyncCursor cursor) {
    return syncPullStore.findTombstones(userId, cursor);
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
