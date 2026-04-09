package com.habittracker.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
    name = "checkins",
    indexes = {
      @Index(name = "checkins_user_updated_cursor_idx", columnList = "userId,updatedAt,id")
    },
    uniqueConstraints = {
      @UniqueConstraint(name = "habit_date_unique", columnNames = {"habitId", "date"})
    }
)
public class CheckinEntity extends PanacheEntityBase {
  @Id
  @Column(nullable = false)
  public String id;

  @Column(name = "habitId", nullable = false)
  public String habitId;

  @Column(name = "userId", nullable = false)
  public String userId;

  @Column(nullable = false)
  public LocalDate date;

  @Column(nullable = false)
  public boolean done;

  @Column(nullable = false)
  public int count;

  @Column(name = "createdAt", nullable = false)
  public Instant createdAt;

  @Column(name = "updatedAt", nullable = false)
  public Instant updatedAt;

  @Column(nullable = false)
  public int version;

  @PrePersist
  void prePersist() {
    ensureId();
    count = Math.max(1, count);
    version = Math.max(1, version);
    createdAt = createdAt == null ? Instant.now() : createdAt;
    updatedAt = updatedAt == null ? createdAt : updatedAt;
  }

  private void ensureId() {
    if (id == null || id.isBlank()) {
      id = UUID.randomUUID().toString();
    }
  }

  public LocalDate syncDate() {
    return date;
  }

  public Instant createdAtValue() {
    return createdAt;
  }

  public Instant updatedAtValue() {
    return updatedAt;
  }

  public void setAuditTimestamps(Instant created, Instant updated) {
    createdAt = created;
    updatedAt = updated;
  }

  public void setCheckinDate(LocalDate value) {
    date = value;
  }

  public void setUpdatedAt(Instant instant) {
    updatedAt = instant;
  }
}
