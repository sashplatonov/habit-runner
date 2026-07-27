package com.sashplatonov.habbit.runner.model;

import com.sashplatonov.habbit.runner.checkin.support.CheckinMutationSupport;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(
    name = "checkins",
    indexes = {
        @Index(name = "checkins_user_updated_cursor_idx", columnList = "userId,updatedAt,id"),
        @Index(name = "checkins_user_date_cursor_idx", columnList = "userId,date,id"),
        @Index(name = "checkins_habit_user_date_idx", columnList = "habitId,userId,date")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "habit_date_unique", columnNames = {"habitId", "date"})
    }
)
@Getter
@Setter
@EqualsAndHashCode(callSuper = false)
public class CheckinEntity extends UuidAuditedEntityBase {
  @Column(name = "habitId", nullable = false)
  private String habitId;

  @Column(name = "userId", nullable = false)
  private String userId;

  @Column(nullable = false)
  private LocalDate date;

  @Column(nullable = false)
  private boolean done;

  @Column(nullable = false)
  private int count;

  @Column(nullable = false)
  private int version;

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
