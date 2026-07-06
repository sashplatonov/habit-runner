package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.SyncOpLogEntity;
import com.sashplatonov.habbit.runner.repository.SyncOpLogRepository;

import java.util.HashSet;
import java.util.Set;

final class RepositoryPathStubSyncOpLogRepository extends SyncOpLogRepository {
  private final Set<String> seen = new HashSet<>();

  @Override
  public boolean createIfAbsent(SyncOpLogEntity entity) {
    return seen.add(entity.opId);
  }
}
