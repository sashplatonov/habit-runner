package com.sashplatonov.habbit.runner.repository;

import com.sashplatonov.habbit.runner.model.SyncOpLogEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class SyncOpLogRepository implements PanacheRepositoryBase<SyncOpLogEntity, String> {

  @Transactional
  public boolean createIfAbsent(SyncOpLogEntity entity) {
    try {
      persist(entity);
      flush();
      return true;
    } catch (PersistenceException exception) {
      return false;
    }
  }
}
