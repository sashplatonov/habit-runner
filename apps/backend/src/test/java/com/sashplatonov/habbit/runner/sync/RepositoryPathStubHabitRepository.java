package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.repository.HabitRepository;

import java.time.Instant;
import java.util.List;

final class RepositoryPathStubHabitRepository extends HabitRepository {
  private HabitEntity existingHabit;
  private HabitEntity savedHabit;
  private String deletedHabitId;
  private String lastUserId;
  private Instant lastUpdatedAt;
  private String lastCursorId;
  private List<HabitEntity> page = List.of();

  void setExistingHabit(HabitEntity existingHabit) {
    this.existingHabit = existingHabit;
  }

  HabitEntity getSavedHabit() {
    return savedHabit;
  }

  String getDeletedHabitId() {
    return deletedHabitId;
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

  void setPage(List<HabitEntity> page) {
    this.page = page;
  }

  @Override
  public HabitEntity findHabitById(String habitId) {
    return existingHabit;
  }

  @Override
  public List<HabitEntity> findPageForUser(String userId, Instant updatedAt, String cursorId, int pageSize) {
    lastUserId = userId;
    lastUpdatedAt = updatedAt;
    lastCursorId = cursorId;
    return page;
  }

  @Override
  public void save(HabitEntity entity) {
    savedHabit = entity;
    existingHabit = entity;
  }

  @Override
  public long deleteByIdAndUserId(String habitId, String userId) {
    deletedHabitId = habitId;
    return 1L;
  }
}
