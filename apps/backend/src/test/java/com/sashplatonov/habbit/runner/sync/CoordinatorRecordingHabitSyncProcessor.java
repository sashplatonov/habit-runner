package com.sashplatonov.habbit.runner.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

final class CoordinatorRecordingHabitSyncProcessor extends HabitSyncProcessor {
  private final List<String> opIds = new ArrayList<>();

  CoordinatorRecordingHabitSyncProcessor() {
    this(new SyncPayloadCodec(new ObjectMapper()));
  }

  private CoordinatorRecordingHabitSyncProcessor(SyncPayloadCodec payloadCodec) {
    super(payloadCodec, new SyncValueCodec(), new SyncPayloadMapperImpl());
  }

  List<String> getOpIds() {
    return opIds;
  }

  @Override
  public void apply(String userId, SyncOpDto op, SyncPushState state) {
    opIds.add(op.id());
    state.addAppliedHabit(op.id(), SyncTestEntities.coordinatorHabit(op.id() + "-habit", Instant.parse("2026-04-10T15:10:00Z")));
  }
}
