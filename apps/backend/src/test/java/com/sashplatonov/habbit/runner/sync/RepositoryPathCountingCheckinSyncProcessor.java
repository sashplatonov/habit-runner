package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

final class RepositoryPathCountingCheckinSyncProcessor extends CheckinSyncProcessor {
  private int applyCount;

  RepositoryPathCountingCheckinSyncProcessor(
      SyncPayloadCodec payloadCodec,
      CheckinDeleteHandler checkinDeleteHandler,
      SyncPayloadMapper payloadMapper
  ) {
    super(payloadCodec, checkinDeleteHandler, payloadMapper);
  }

  int getApplyCount() {
    return applyCount;
  }

  @Override
  public void apply(String userId, SyncOpDto op, SyncPushState state) {
    applyCount++;
    state.addAppliedCheckin(op.id(), SyncTestEntities.repositoryPathCheckin(
        UUID.randomUUID().toString(),
        "habit-1",
        userId,
        LocalDate.of(2026, 4, 10),
        Instant.parse("2026-04-10T10:00:00Z")
    ));
  }
}
