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
  public List<CheckinEntity> findAllByUserId(String userId) {
    return find("userId = ?1 ORDER BY date ASC, id ASC", userId).list();
  }

  public CheckinEntity findByHabitDateAndUserId(String habitId, LocalDate date, String userId) {
    return find("habitId = ?1 and date = ?2 and userId = ?3", habitId, date, userId).firstResult();
  }

  public List<CheckinEntity> findPageForUser(String userId, Instant updatedAt, String cursorId, int pageSize) {
    if (updatedAt == null || cursorId == null) {
      return find("userId = ?1 ORDER BY updatedAt ASC, id ASC", userId)
          .page(0, pageSize)
          .list();
    }
    return find(
        "userId = ?1 AND (updatedAt > ?2 OR (updatedAt = ?2 AND id > ?3)) ORDER BY updatedAt ASC, id ASC",
        userId,
        updatedAt,
        cursorId
    ).page(0, pageSize).list();
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
}
