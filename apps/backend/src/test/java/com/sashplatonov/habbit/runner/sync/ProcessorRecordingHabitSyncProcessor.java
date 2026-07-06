package com.sashplatonov.habbit.runner.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

final class ProcessorRecordingHabitSyncProcessor extends HabitSyncProcessor {
  private final List<String> opIds = new ArrayList<>();

  ProcessorRecordingHabitSyncProcessor() {
    this(new SyncPayloadCodec(new ObjectMapper()));
  }

  private ProcessorRecordingHabitSyncProcessor(SyncPayloadCodec payloadCodec) {
    super(payloadCodec, new SyncValueCodec(), new SyncPayloadMapperImpl());
  }

  List<String> getOpIds() {
    return opIds;
  }

  @Override
  public void apply(String userId, SyncOpDto op, SyncPushState state) {
    opIds.add(op.id());
    HabitEntity habit = SyncTestEntities.processorHabit(op.id() + "-habit", userId, Instant.parse("2026-04-10T12:00:00Z"));
    state.addAppliedHabit(op.id(), habit);
  }
}
