package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "oauth_states")
public class OAuthStateEntity extends AuditedEntityBase {
  @Id
  @Column(nullable = false)
  public String state;

  @Column(name = "returnTo", nullable = false)
  public String returnTo;

  @Column(name = "expiresAt", nullable = false)
  private Instant expiresAt;

  @Column(name = "linkUserId")
  private String linkUserId;

  public boolean isExpiredAt(Instant instant) {
    return expiresAt.isBefore(instant);
  }

  public void setExpiry(Instant instant) {
    expiresAt = instant;
  }

  public Instant expiry() {
    return expiresAt;
  }

  public String linkUserId() {
    return linkUserId;
  }

  public void setLinkUserId(String linkUserId) {
    this.linkUserId = linkUserId;
  }
}
