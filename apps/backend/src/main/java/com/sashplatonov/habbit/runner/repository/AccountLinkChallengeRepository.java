package com.sashplatonov.habbit.runner.repository;

import com.sashplatonov.habbit.runner.model.AccountLinkChallengeEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AccountLinkChallengeRepository implements PanacheRepositoryBase<AccountLinkChallengeEntity, String> {
  public AccountLinkChallengeEntity findByTokenHash(String tokenHash) {
    return find("tokenHash", tokenHash).firstResult();
  }

  @Transactional
  public void save(AccountLinkChallengeEntity entity) {
    persist(entity);
  }
}
