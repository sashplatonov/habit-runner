package com.sashplatonov.habbit.runner.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

final class CoordinatorRecordingCheckinSyncProcessor extends CheckinSyncProcessor {
  private final List<String> opIds = new ArrayList<>();

  CoordinatorRecordingCheckinSyncProcessor() {
    this(new SyncPayloadCodec(new ObjectMapper()));
  }

  private CoordinatorRecordingCheckinSyncProcessor(SyncPayloadCodec payloadCodec) {
    super(payloadCodec, new CheckinDeleteHandler(payloadCodec), new SyncPayloadMapperImpl());
  }

  List<String> getOpIds() {
    return opIds;
  }

  @Override
  public void apply(String userId, SyncOpDto op, SyncPushState state) {
    opIds.add(op.id());
    state.addAppliedCheckin(op.id(), SyncTestEntities.coordinatorCheckin(op.id() + "-checkin", Instant.parse("2026-04-10T15:11:00Z")));
  }
}
