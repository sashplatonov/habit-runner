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
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@MappedSuperclass
@Getter
@Setter
public abstract class AuditedEntityBase extends PanacheEntityBase {
  @Column(name = "createdAt", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updatedAt", nullable = false)
  private Instant updatedAt;

  @Transient
  private boolean updatedAtExplicitlySet;

  // Methods for test compatibility
  public Instant createdAtValue() {
    return createdAt;
  }

  public Instant updatedAtValue() {
    return updatedAt;
  }

  public void setAuditTimestamps(Instant createdAt, Instant updatedAt) {
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Custom setter to track explicit updates for audit purposes
  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
    this.updatedAtExplicitlySet = true;
  }

  @PrePersist
  void prePersistAudit() {
    var initialTimestamp = defaultAuditTimestamp();
    setCreatedAt(getCreatedAt() != null ? getCreatedAt() : initialTimestamp);
    setUpdatedAt(getUpdatedAt() != null ? getUpdatedAt() : getCreatedAt());
    updatedAtExplicitlySet = false;
  }

  @PreUpdate
  void preUpdateAudit() {
    if (!updatedAtExplicitlySet || getUpdatedAt() == null) {
      setUpdatedAt(Instant.now());
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
}
