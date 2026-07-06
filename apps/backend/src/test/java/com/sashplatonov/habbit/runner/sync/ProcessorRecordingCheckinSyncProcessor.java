package com.sashplatonov.habbit.runner.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

final class ProcessorRecordingCheckinSyncProcessor extends CheckinSyncProcessor {
  private final List<String> opIds = new ArrayList<>();

  ProcessorRecordingCheckinSyncProcessor() {
    this(new SyncPayloadCodec(new ObjectMapper()));
  }

  private ProcessorRecordingCheckinSyncProcessor(SyncPayloadCodec payloadCodec) {
    super(payloadCodec, new CheckinDeleteHandler(payloadCodec), new SyncPayloadMapperImpl());
  }

  List<String> getOpIds() {
    return opIds;
  }

  @Override
  public void apply(String userId, SyncOpDto op, SyncPushState state) {
    opIds.add(op.id());
    CheckinEntity checkin = SyncTestEntities.processorCheckin(op.id() + "-checkin", userId, LocalDate.parse("2026-04-10"), Instant.parse("2026-04-10T12:00:00Z"));
    state.addAppliedCheckin(op.id(), checkin);
  }
}
