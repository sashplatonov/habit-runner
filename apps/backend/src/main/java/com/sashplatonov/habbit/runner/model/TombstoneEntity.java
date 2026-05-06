package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(
    name = "tombstones",
    indexes = {
        @Index(name = "tombstones_user_deleted_cursor_idx", columnList = "userId,deletedAt,id")
    }
)
@Getter
@Setter
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

  // Getters and setters for backward compatibility
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getEntity() { return entity; }
  public void setEntity(String entity) { this.entity = entity; }
  public String getEntityId() { return entityId; }
  public void setEntityId(String entityId) { this.entityId = entityId; }
  public int getVersion() { return version; }
  public void setVersion(int version) { this.version = version; }
  public Instant getDeletedAt() { return deletedAt; }
  public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }

  public Instant deletedAtValue() {
    return deletedAt;
  }

  @Override
  protected Instant defaultAuditTimestamp() {
    return deletedAt != null ? deletedAt : super.defaultAuditTimestamp();
  }
}
