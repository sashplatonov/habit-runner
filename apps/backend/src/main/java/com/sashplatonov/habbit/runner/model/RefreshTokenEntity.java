package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
public class RefreshTokenEntity extends UuidAuditedEntityBase {
  @Column(nullable = false, unique = true)
  private String token;

  @Column(name = "userId", nullable = false)
  private String userId;

  @Column(nullable = false)
  private boolean revoked;

  @Column(name = "expiresAt", nullable = false)
  private Instant expiresAt;

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
    return !isRevoked() && !getExpiresAt().isBefore(instant);
  }

  public void revoke() {
    setRevoked(true);
  }

  public void setExpiry(Instant instant) {
    setExpiresAt(instant);
  }

  public String tokenValue() {
    return getToken();
  }
}
