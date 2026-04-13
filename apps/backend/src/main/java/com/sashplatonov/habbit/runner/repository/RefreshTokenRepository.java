package com.sashplatonov.habbit.runner.repository;

import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class RefreshTokenRepository implements PanacheRepositoryBase<RefreshTokenEntity, String> {

  public RefreshTokenEntity findByToken(String token) {
    return find("token", token).firstResult();
  }

  @Transactional
  public void save(RefreshTokenEntity entity) {
    persist(entity);
  }
}
