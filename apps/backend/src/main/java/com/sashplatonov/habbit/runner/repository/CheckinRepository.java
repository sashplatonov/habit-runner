package com.sashplatonov.habbit.runner.repository;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class CheckinRepository implements PanacheRepositoryBase<CheckinEntity, String> {
  public static final int DEFAULT_LIST_LIMIT = 200;
  public static final int DEFAULT_SYNC_PAGE_SIZE = 200;
  private static final int MAX_PAGE_SIZE = 200;

  public List<CheckinEntity> findListForUser(String userId) {
    return findListForUser(userId, DEFAULT_LIST_LIMIT);
  }

  public List<CheckinEntity> findListForUser(String userId, int limit) {
    var pageSize = boundedPageSize(limit);
    return find("userId = ?1 ORDER BY date ASC, id ASC", userId)
        .page(0, pageSize)
        .list();
  }

  public CheckinEntity findByHabitDateAndUserId(String habitId, LocalDate date, String userId) {
    return find("habitId = ?1 and date = ?2 and userId = ?3", habitId, date, userId).firstResult();
  }

  public List<CheckinEntity> findSyncPageForUser(String userId) {
    return findSyncPageForUser(userId, null, null, DEFAULT_SYNC_PAGE_SIZE);
  }

  public List<CheckinEntity> findSyncPageForUser(String userId, Instant updatedAt, String cursorId, int pageSize) {
    var boundedPageSize = boundedPageSize(pageSize);
    if (updatedAt == null || cursorId == null) {
      return find("userId = ?1 ORDER BY updatedAt ASC, id ASC", userId)
          .page(0, boundedPageSize)
          .list();
    }
    return find(
        "userId = ?1 AND (updatedAt > ?2 OR (updatedAt = ?2 AND id > ?3)) ORDER BY updatedAt ASC, id ASC",
        userId,
        updatedAt,
        cursorId
    ).page(0, boundedPageSize).list();
  }

  public List<CheckinEntity> findAllByUserId(String userId) {
    return find("userId = ?1 ORDER BY date ASC, id ASC", userId).list();
  }

  public List<CheckinEntity> findPageForUser(String userId, Instant updatedAt, String cursorId, int pageSize) {
    return findSyncPageForUser(userId, updatedAt, cursorId, pageSize);
  }

  @Transactional
  public void save(CheckinEntity entity) {
    persist(entity);
  }

  @Transactional
  public long deleteByHabitIdAndUserId(String habitId, String userId) {
    return delete("habitId = ?1 and userId = ?2", habitId, userId);
  }

  @Transactional
  public long deleteByHabitIdUserIdAndDate(String habitId, String userId, LocalDate date) {
    return delete("habitId = ?1 and userId = ?2 and date = ?3", habitId, userId, date);
  }

  private int boundedPageSize(int requestedSize) {
    return Math.max(1, Math.min(requestedSize, MAX_PAGE_SIZE));
  }
}
