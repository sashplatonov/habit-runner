package com.sashplatonov.habbit.runner.sync;

import java.util.HashSet;
import java.util.Set;

final class CoordinatorTestSyncPushProcessor extends SyncPushProcessor {
  private final Set<String> seenOpIds = new HashSet<>();

  CoordinatorTestSyncPushProcessor(
      HabitSyncProcessor habitSyncProcessor,
      CheckinSyncProcessor checkinSyncProcessor,
      SyncPushResultFactory resultFactory
  ) {
    super(habitSyncProcessor, checkinSyncProcessor, resultFactory);
  }

  @Override
  protected boolean tryCreateLog(String opId) {
    return seenOpIds.add(opId);
  }
}
