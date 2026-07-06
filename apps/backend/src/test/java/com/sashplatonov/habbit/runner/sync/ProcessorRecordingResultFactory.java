package com.sashplatonov.habbit.runner.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.sync.dto.PushResponseDto;

import java.util.List;

final class ProcessorRecordingResultFactory extends SyncPushResultFactory {
  private SyncPushState lastState;

  ProcessorRecordingResultFactory() {
    super(new SyncPayloadCodec(new ObjectMapper()), new SyncEntityMapper(new SyncPayloadCodec(new ObjectMapper())));
  }

  SyncPushState getLastState() {
    return lastState;
  }

  @Override
  public PushResponseDto create(SyncPushState state) {
    lastState = state;
    return PushResponseDto.builder()
        .applied(state.applied())
        .conflicts(state.conflicts())
        .habits(List.of())
        .checkins(List.of())
        .tombstones(List.of())
        .nextCursor(null)
        .serverTime("2026-04-10T12:00:00Z")
        .build();
  }
}
