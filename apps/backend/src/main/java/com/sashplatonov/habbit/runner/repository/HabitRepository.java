package com.sashplatonov.habbit.runner.repository;

import com.sashplatonov.habbit.runner.model.HabitEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.List;

@ApplicationScoped
public class HabitRepository implements PanacheRepositoryBase<HabitEntity, String> {
  public List<HabitEntity> findAllByUserId(String userId) {
    return find("userId = ?1 ORDER BY sortOrder ASC, createdAt ASC, id ASC", userId).list();
  }

  public HabitEntity findHabitById(String habitId) {
    return findById(habitId);
  }

  public HabitEntity findByIdAndUserId(String habitId, String userId) {
    return find("id = ?1 and userId = ?2", habitId, userId).firstResult();
  }

  public List<HabitEntity> findPageForUser(String userId, Instant updatedAt, String cursorId, int pageSize) {
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
  public void save(HabitEntity entity) {
    persist(entity);
  }

  @Transactional
  public long deleteByIdAndUserId(String habitId, String userId) {
    return delete("id = ?1 and userId = ?2", habitId, userId);
  }
}
