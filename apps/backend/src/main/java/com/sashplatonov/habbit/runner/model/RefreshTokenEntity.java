package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
public class RefreshTokenEntity extends UuidAuditedEntityBase {
  @Column(name = "tokenHash", nullable = false, unique = true)
  private String tokenHash;

  @Column(name = "familyId", nullable = false)
  private String familyId;

  @Column(name = "userId", nullable = false)
  private String userId;

  @Column(nullable = false)
  private boolean revoked;

  @Column(name = "replacementTokenHash")
  private String replacementTokenHash;

  @Column(name = "rotatedAt")
  private Instant rotatedAt;

  @Column(name = "expiresAt", nullable = false)
  private Instant expiresAt;

  public String getTokenHash() {
    return tokenHash;
  }

  public void setTokenHash(String tokenHash) {
    this.tokenHash = tokenHash;
  }

  public String getFamilyId() {
    return familyId;
  }

  public void setFamilyId(String familyId) {
    this.familyId = familyId;
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

  public String getReplacementTokenHash() {
    return replacementTokenHash;
  }

  public void setReplacementTokenHash(String replacementTokenHash) {
    this.replacementTokenHash = replacementTokenHash;
  }

  public Instant getRotatedAt() {
    return rotatedAt;
  }

  public void setRotatedAt(Instant rotatedAt) {
    this.rotatedAt = rotatedAt;
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

  public boolean isRotated() {
    return replacementTokenHash != null && !replacementTokenHash.isBlank();
  }

  public void markRotated(String replacementTokenHash, Instant rotatedAt) {
    setReplacementTokenHash(replacementTokenHash);
    setRotatedAt(rotatedAt);
    revoke();
  }

  public boolean shouldRevokeFamily(Instant now, long graceSeconds) {
    if (rotatedAt == null) {
      return true;
    }
    return now.isAfter(rotatedAt.plusSeconds(graceSeconds));
  }

  @PrePersist
  void prePersistRefreshToken() {
    if (!hasText(familyId)) {
      familyId = UUID.randomUUID().toString();
    }
  }
}
