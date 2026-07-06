package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

final class RepositoryPathStubCheckinRepository extends CheckinRepository {
  private CheckinEntity existingCheckin;
  private CheckinEntity savedCheckin;
  private String deletedByHabitId;
  private LocalDate deletedDate;
  private String lastUserId;
  private Instant lastUpdatedAt;
  private String lastCursorId;
  private List<CheckinEntity> page = List.of();

  void setExistingCheckin(CheckinEntity existingCheckin) {
    this.existingCheckin = existingCheckin;
  }

  CheckinEntity getSavedCheckin() {
    return savedCheckin;
  }

  String getDeletedByHabitId() {
    return deletedByHabitId;
  }

  LocalDate getDeletedDate() {
    return deletedDate;
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

  void setPage(List<CheckinEntity> page) {
    this.page = page;
  }

  @Override
  public CheckinEntity findByHabitDateAndUserId(String habitId, LocalDate date, String userId) {
    return existingCheckin;
  }

  @Override
  public List<CheckinEntity> findPageForUser(String userId, Instant updatedAt, String cursorId, int pageSize) {
    lastUserId = userId;
    lastUpdatedAt = updatedAt;
    lastCursorId = cursorId;
    return page;
  }

  @Override
  public void save(CheckinEntity entity) {
    savedCheckin = entity;
    existingCheckin = entity;
  }

  @Override
  public long deleteByHabitIdAndUserId(String habitId, String userId) {
    deletedByHabitId = habitId;
    return 1L;
  }

  @Override
  public long deleteByHabitIdUserIdAndDate(String habitId, String userId, LocalDate date) {
    deletedByHabitId = habitId;
    deletedDate = date;
    return 1L;
  }
}
