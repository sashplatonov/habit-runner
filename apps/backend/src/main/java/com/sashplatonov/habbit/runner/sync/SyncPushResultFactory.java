package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.sync.dto.PushResponseDto;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;

@ApplicationScoped
public class SyncPushResultFactory {
  private final SyncPayloadCodec payloadCodec;
  private final SyncEntityMapper entityMapper;

  public SyncPushResultFactory(SyncPayloadCodec payloadCodec, SyncEntityMapper entityMapper) {
    this.payloadCodec = payloadCodec;
    this.entityMapper = entityMapper;
  }

  public PushResponseDto create(SyncPushState state) {
    var candidates = collectCursors(state);
    return PushResponseDto.builder()
        .applied(state.applied())
        .conflicts(state.conflicts())
        .habits(state.pushedHabits().stream().map(entityMapper::serializeHabit).toList())
        .checkins(state.pushedCheckins().stream().map(entityMapper::serializeCheckin).toList())
        .tombstones(state.pushedTombstones().stream().map(entityMapper::serializeTombstone).toList())
        .nextCursor(candidates.isEmpty() ? null : payloadCodec.calculateNextCursor(candidates))
        .serverTime(payloadCodec.toSyncIso(Instant.now()))
        .build();
  }

  private java.util.List<SyncCursor> collectCursors(SyncPushState state) {
    var candidates = new java.util.ArrayList<SyncCursor>();
    state.pushedHabits().forEach(habit -> candidates.add(entityMapper.habitCursor(habit)));
    state.pushedCheckins().forEach(checkin -> candidates.add(entityMapper.checkinCursor(checkin)));
    state.pushedTombstones().forEach(tombstone -> candidates.add(entityMapper.tombstoneCursor(tombstone)));
    return candidates;
  }
}
