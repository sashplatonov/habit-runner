package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import com.sashplatonov.habbit.runner.repository.TombstoneRepository;

import java.time.Instant;
import java.util.List;

final class RepositoryPathStubTombstoneRepository extends TombstoneRepository {
  private TombstoneEntity savedTombstone;
  private String lastUserId;
  private Instant lastUpdatedAt;
  private String lastCursorId;
  private List<TombstoneEntity> page = List.of();

  TombstoneEntity getSavedTombstone() {
    return savedTombstone;
  }

  String getLastUserId() {
    return lastUserId;
  }

  Instant getLastUpdatedAt() {
    return lastUpdatedAt;
  }

  String getLastCursorId() {
    return lastCursorId;
  }

  void setPage(List<TombstoneEntity> page) {
    this.page = page;
  }

  @Override
  public List<TombstoneEntity> findPageForUser(String userId, Instant deletedAt, String cursorId, int pageSize) {
    lastUserId = userId;
    lastUpdatedAt = deletedAt;
    lastCursorId = cursorId;
    return page;
  }

  @Override
  public void save(TombstoneEntity entity) {
    savedTombstone = entity;
  }
}
