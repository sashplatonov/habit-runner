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

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }

  public String getEndpoint() {
    return endpoint;
  }

  public void setEndpoint(String endpoint) {
    this.endpoint = endpoint;
  }

  public String getP256dh() {
    return p256dh;
  }

  public void setP256dh(String p256dh) {
    this.p256dh = p256dh;
  }

  public String getAuth() {
    return auth;
  }

  public void setAuth(String auth) {
    this.auth = auth;
  }
}
