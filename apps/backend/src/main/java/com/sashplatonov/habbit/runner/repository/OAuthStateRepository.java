package com.sashplatonov.habbit.runner.repository;

import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class OAuthStateRepository implements PanacheRepositoryBase<OAuthStateEntity, String> {

  @Transactional
  public void save(OAuthStateEntity entity) {
    persist(entity);
  }

  @Transactional
  public boolean deleteState(String state) {
    return deleteById(state);
  }
}