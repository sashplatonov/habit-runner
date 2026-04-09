package com.habittracker.sync;

import com.habittracker.sync.dto.PushResponseDto;
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
    return new PushResponseDto(
        state.applied(),
        state.conflicts(),
        state.pushedHabits().stream().map(entityMapper::serializeHabit).toList(),
        state.pushedCheckins().stream().map(entityMapper::serializeCheckin).toList(),
        state.pushedTombstones().stream().map(entityMapper::serializeTombstone).toList(),
        candidates.isEmpty() ? null : payloadCodec.calculateNextCursor(candidates),
        payloadCodec.toSyncIso(Instant.now())
    );
  }

  private java.util.List<SyncCursor> collectCursors(SyncPushState state) {
    var candidates = new java.util.ArrayList<SyncCursor>();
    state.pushedHabits().forEach(habit -> candidates.add(entityMapper.habitCursor(habit)));
    state.pushedCheckins().forEach(checkin -> candidates.add(entityMapper.checkinCursor(checkin)));
    state.pushedTombstones().forEach(tombstone -> candidates.add(entityMapper.tombstoneCursor(tombstone)));
    return candidates;
  }
}
