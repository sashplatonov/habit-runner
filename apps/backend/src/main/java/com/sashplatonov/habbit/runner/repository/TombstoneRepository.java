package com.sashplatonov.habbit.runner.repository;

import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.List;

@ApplicationScoped
public class TombstoneRepository implements PanacheRepositoryBase<TombstoneEntity, String> {

  public List<TombstoneEntity> findPageForUser(String userId, Instant deletedAt, String cursorId, int pageSize) {
    if (deletedAt == null || cursorId == null) {
      return find("userId = ?1 ORDER BY deletedAt ASC, id ASC", userId)
          .page(0, pageSize)
          .list();
    }
    return find(
        "userId = ?1 AND (deletedAt > ?2 OR (deletedAt = ?2 AND id > ?3)) ORDER BY deletedAt ASC, id ASC",
        userId,
        deletedAt,
        cursorId
    ).page(0, pageSize).list();
  }

  @Transactional
  public void save(TombstoneEntity entity) {
    persist(entity);
  }
}
