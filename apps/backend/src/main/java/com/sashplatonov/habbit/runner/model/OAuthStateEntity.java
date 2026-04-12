package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;

import java.time.Instant;

@Entity
@Table(name = "oauth_states")
public class OAuthStateEntity extends PanacheEntityBase {
  @Id
  @Column(nullable = false)
  public String state;

  @Column(name = "returnTo", nullable = false)
  public String returnTo;

  @Column(name = "expiresAt", nullable = false)
  public Instant expiresAt;

  @Column(name = "createdAt", nullable = false)
  public Instant createdAt;

  @PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }

  public boolean isExpiredAt(Instant instant) {
    return expiresAt.isBefore(instant);
  }

  public void setExpiry(Instant instant) {
    expiresAt = instant;
  }
}
