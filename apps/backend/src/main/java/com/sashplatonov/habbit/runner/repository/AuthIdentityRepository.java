package com.sashplatonov.habbit.runner.repository;

import com.sashplatonov.habbit.runner.auth.identity.AuthProvider;
import com.sashplatonov.habbit.runner.model.AuthIdentityEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AuthIdentityRepository implements PanacheRepositoryBase<AuthIdentityEntity, String> {
  public AuthIdentityEntity findByProviderAndSubject(AuthProvider provider, String providerSubject) {
    return find("provider = ?1 and providerSubject = ?2", provider, providerSubject).firstResult();
  }

  public AuthIdentityEntity findByUserIdAndProvider(String userId, AuthProvider provider) {
    return find("userId = ?1 and provider = ?2", userId, provider).firstResult();
  }

  @Transactional
  public void save(AuthIdentityEntity entity) {
    persist(entity);
  }
}
