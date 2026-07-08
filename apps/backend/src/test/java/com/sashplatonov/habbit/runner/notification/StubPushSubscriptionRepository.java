package com.sashplatonov.habbit.runner.notification;

import com.sashplatonov.habbit.runner.model.PushSubscriptionEntity;
import com.sashplatonov.habbit.runner.repository.PushSubscriptionRepository;

public final class StubPushSubscriptionRepository extends PushSubscriptionRepository {
  private PushSubscriptionEntity existing;
  private PushSubscriptionEntity savedEntity;
  private String deletedEndpoint;

  @Override
  public PushSubscriptionEntity findByEndpoint(String endpoint) {
    return existing;
  }

  @Override
  public void save(PushSubscriptionEntity entity) {
    savedEntity = entity;
    existing = entity;
  }

  @Override
  public long deleteByEndpoint(String endpoint) {
    deletedEndpoint = endpoint;
    existing = null;
    return 1L;
  }

  @Override
  public long deleteByEndpointAndUserId(String endpoint, String userId) {
    deletedEndpoint = endpoint;
    if (existing != null && userId.equals(existing.getUserId()) && endpoint.equals(existing.getEndpoint())) {
      existing = null;
      return 1L;
    }
    return 0L;
  }

  public PushSubscriptionEntity getSavedEntity() {
    return savedEntity;
  }

  public void setExisting(PushSubscriptionEntity existing) {
    this.existing = existing;
  }

  public String getDeletedEndpoint() {
    return deletedEndpoint;
  }

  public String getSavedUserId() {
    return savedEntity == null ? null : savedEntity.getUserId();
  }

  public String getSavedEndpoint() {
    return savedEntity == null ? null : savedEntity.getEndpoint();
  }

  public void promoteSavedToExisting() {
    existing = savedEntity;
  }
}
