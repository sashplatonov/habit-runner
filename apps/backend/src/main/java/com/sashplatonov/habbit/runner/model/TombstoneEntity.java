package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(
    name = "tombstones",
    indexes = {
      @Index(name = "tombstones_user_deleted_cursor_idx", columnList = "userId,deletedAt,id")
    }
)
public class TombstoneEntity extends UuidAuditedEntityBase {
  @Column(name = "userId", nullable = false)
  public String userId;

  @Column(nullable = false)
  public String entity;

  @Column(name = "entityId", nullable = false)
  public String entityId;

  @Column(nullable = false)
  public int version;

  @Column(name = "deletedAt", nullable = false)
  public Instant deletedAt;

  @PrePersist
  void prePersist() {
    if (version < 1) {
      version = 1;
    }
    if (deletedAt == null) {
      deletedAt = Instant.now();
    }
  }

  public Instant deletedAtValue() {
    return deletedAt;
  }

  public void setDeletedAt(Instant instant) {
    deletedAt = instant;
  }

  @Override
  protected Instant defaultAuditTimestamp() {
    return deletedAt != null ? deletedAt : super.defaultAuditTimestamp();
  }
}
