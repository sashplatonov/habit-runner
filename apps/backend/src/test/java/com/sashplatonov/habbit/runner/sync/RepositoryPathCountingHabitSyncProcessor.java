package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;

import java.time.Instant;
import java.util.UUID;

final class RepositoryPathCountingHabitSyncProcessor extends HabitSyncProcessor {
  private int applyCount;

  RepositoryPathCountingHabitSyncProcessor(
      SyncPayloadCodec payloadCodec,
      SyncValueCodec valueCodec,
      SyncPayloadMapper payloadMapper
  ) {
    super(payloadCodec, valueCodec, payloadMapper);
  }

  int getApplyCount() {
    return applyCount;
  }

  @Override
  public void apply(String userId, SyncOpDto op, SyncPushState state) {
    applyCount++;
    state.addAppliedHabit(op.id(), SyncTestEntities.repositoryPathHabit(UUID.randomUUID().toString(), userId, Instant.parse("2026-04-10T10:00:00Z")));
  }
}
