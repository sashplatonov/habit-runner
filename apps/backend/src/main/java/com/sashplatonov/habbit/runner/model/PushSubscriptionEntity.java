package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "push_subscriptions")
public class PushSubscriptionEntity extends UuidAuditedEntityBase {
  @Column(name = "userId", nullable = false)
  public String userId;

  @Column(nullable = false, unique = true)
  public String endpoint;

  @Column(nullable = false)
  public String p256dh;

  @Column(nullable = false)
  public String auth;
}
