package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.time.LocalDate;

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
public class CheckinEntity extends UuidAuditedEntityBase {
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

  @Column(nullable = false)
  public int version;

  @PrePersist
  void prePersist() {
    count = Math.max(1, count);
    version = Math.max(1, version);
  }

  // Getters and setters for backward compatibility
  public String getHabitId() { return habitId; }
  public void setHabitId(String habitId) { this.habitId = habitId; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public LocalDate getDate() { return date; }
  public void setDate(LocalDate date) { this.date = date; }
  public boolean isDone() { return done; }
  public void setDone(boolean done) { this.done = done; }
  public int getCount() { return count; }
  public void setCount(int count) { this.count = count; }
  public int getVersion() { return version; }
  public void setVersion(int version) { this.version = version; }

  public LocalDate syncDate() {
    return getDate();
  }

  public void setAuditTimestamps(Instant created, Instant updated) {
    setCreatedAt(created);
    setUpdatedAt(updated);
  }

  public void setCheckinDate(LocalDate value) {
    setDate(value);
  }
}
