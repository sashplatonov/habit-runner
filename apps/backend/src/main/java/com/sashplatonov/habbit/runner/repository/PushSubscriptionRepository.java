package com.sashplatonov.habbit.runner.repository;

import com.sashplatonov.habbit.runner.model.PushSubscriptionEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class PushSubscriptionRepository implements PanacheRepositoryBase<PushSubscriptionEntity, String> {

  public PushSubscriptionEntity findByEndpoint(String endpoint) {
    return find("endpoint", endpoint).firstResult();
  }

  @Transactional
  public void save(PushSubscriptionEntity entity) {
    persist(entity);
  }

  @Transactional
  public long deleteByEndpoint(String endpoint) {
    return delete("endpoint", endpoint);
  }
}
