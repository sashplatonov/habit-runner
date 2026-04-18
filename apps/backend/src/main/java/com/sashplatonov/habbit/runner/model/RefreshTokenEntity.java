package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
public class RefreshTokenEntity extends UuidAuditedEntityBase {
  @Column(nullable = false, unique = true)
  public String token;

  @Column(name = "userId", nullable = false)
  public String userId;

  @Column(nullable = false)
  public boolean revoked;

  @Column(name = "expiresAt", nullable = false)
  public Instant expiresAt;

  public boolean isActiveAt(Instant instant) {
    return !revoked && !expiresAt.isBefore(instant);
  }

  public void revoke() {
    revoked = true;
  }

  public void setExpiry(Instant instant) {
    expiresAt = instant;
  }

  public String tokenValue() {
    return token;
  }
}
