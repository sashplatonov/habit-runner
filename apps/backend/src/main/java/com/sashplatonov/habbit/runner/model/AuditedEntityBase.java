package com.sashplatonov.habbit.runner.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostUpdate;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Transient;

import java.time.Instant;

@MappedSuperclass
public abstract class AuditedEntityBase extends PanacheEntityBase {
  @Column(name = "createdAt", nullable = false, updatable = false)
  public Instant createdAt;

  @Column(name = "updatedAt", nullable = false)
  public Instant updatedAt;

  @Transient
  private boolean updatedAtExplicitlySet;

  @PrePersist
  void prePersistAudit() {
    var initialTimestamp = defaultAuditTimestamp();
    createdAt = createdAt != null ? createdAt : initialTimestamp;
    updatedAt = updatedAt != null ? updatedAt : createdAt;
    updatedAtExplicitlySet = false;
  }

  @PreUpdate
  void preUpdateAudit() {
    if (!updatedAtExplicitlySet || updatedAt == null) {
      updatedAt = Instant.now();
    }
    updatedAtExplicitlySet = false;
  }

  @PostLoad
  @PostPersist
  @PostUpdate
  void clearUpdatedAtTracking() {
    updatedAtExplicitlySet = false;
  }

  protected Instant defaultAuditTimestamp() {
    return Instant.now();
  }

  public Instant createdAtValue() {
    return createdAt;
  }

  public Instant updatedAtValue() {
    return updatedAt;
  }

  public void setCreatedAt(Instant instant) {
    createdAt = instant;
  }

  public void setUpdatedAt(Instant instant) {
    updatedAt = instant;
    updatedAtExplicitlySet = instant != null;
  }
}
