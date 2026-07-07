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

  @Transactional
  public long deleteByEndpointAndUserId(String endpoint, String userId) {
    return delete("endpoint = ?1 and userId = ?2", endpoint, userId);
  }
}
