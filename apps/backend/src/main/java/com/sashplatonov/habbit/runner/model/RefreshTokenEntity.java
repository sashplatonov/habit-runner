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

  public String getToken() {
    return token;
  }

  public void setToken(String token) {
    this.token = token;
  }

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }

  public boolean isRevoked() {
    return revoked;
  }

  public void setRevoked(boolean revoked) {
    this.revoked = revoked;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public void setExpiresAt(Instant expiresAt) {
    this.expiresAt = expiresAt;
  }

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
