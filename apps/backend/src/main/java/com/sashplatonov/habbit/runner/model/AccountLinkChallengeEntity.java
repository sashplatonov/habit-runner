package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "account_link_challenges")
@Getter
@Setter
public class AccountLinkChallengeEntity extends UuidAuditedEntityBase {
  @Column(name = "ownerUserId", nullable = false)
  private String ownerUserId;

  @Column(name = "tokenHash", nullable = false, unique = true)
  private String tokenHash;

  @Column(nullable = false, length = 32)
  private String status;

  @Column(name = "expiresAt", nullable = false)
  private Instant expiresAt;

  @Column(name = "telegramUserId")
  private String telegramUserId;

  @Column(name = "telegramUsername")
  private String telegramUsername;

  public boolean isExpiredAt(Instant instant) {
    return expiresAt == null || expiresAt.isBefore(instant);
  }
}
