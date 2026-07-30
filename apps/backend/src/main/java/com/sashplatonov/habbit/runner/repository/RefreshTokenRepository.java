package com.sashplatonov.habbit.runner.repository;

import com.sashplatonov.habbit.runner.auth.support.RefreshTokenDigest;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class RefreshTokenRepository implements PanacheRepositoryBase<RefreshTokenEntity, String> {

  public RefreshTokenEntity findByToken(String token) {
    if (token == null || token.isBlank()) {
      return null;
    }
    return find("tokenHash", RefreshTokenDigest.hash(token))
        .withLock(LockModeType.PESSIMISTIC_WRITE)
        .firstResult();
  }

  public List<RefreshTokenEntity> findByFamilyId(String familyId) {
    return list("familyId", familyId);
  }

  @Transactional
  public void save(RefreshTokenEntity entity) {
    persist(entity);
  }
}
