package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "tombstones",
    indexes = {
      @Index(name = "tombstones_user_deleted_cursor_idx", columnList = "userId,deletedAt,id")
    }
)
public class TombstoneEntity extends PanacheEntityBase {
  @Id
  @Column(nullable = false)
  public String id;

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
    if (id == null || id.isBlank()) {
      id = UUID.randomUUID().toString();
    }
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
}
