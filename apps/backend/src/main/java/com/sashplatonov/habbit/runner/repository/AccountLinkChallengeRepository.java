package com.sashplatonov.habbit.runner.repository;

import com.sashplatonov.habbit.runner.model.AccountLinkChallengeEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AccountLinkChallengeRepository implements PanacheRepositoryBase<AccountLinkChallengeEntity, String> {
  public AccountLinkChallengeEntity findByTokenHashForUpdate(String tokenHash) {
    return find("tokenHash", tokenHash).withLock(LockModeType.PESSIMISTIC_WRITE).firstResult();
  }

  @Transactional
  public void save(AccountLinkChallengeEntity entity) {
    persist(entity);
  }
}
