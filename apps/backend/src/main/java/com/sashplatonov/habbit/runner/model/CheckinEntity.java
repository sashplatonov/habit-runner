package com.sashplatonov.habbit.runner.model;

import com.sashplatonov.habbit.runner.checkin.support.CheckinMutationSupport;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

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
@Data
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
    CheckinMutationSupport.normalize(this);
  }

  public LocalDate syncDate() {
    return getDate();
  }

  public void setCheckinDate(LocalDate value) {
    setDate(value);
  }

  // Explicit getter for boolean 'done' for backward compatibility
  public boolean getDone() {
    return done;
  }
}
