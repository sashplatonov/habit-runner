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
    if (id == null || id.isBlank()) {
      id = UUID.randomUUID().toString();
    }
    if (count < 1) {
      count = 1;
    }
    if (version < 1) {
      version = 1;
    }
    if (createdAt == null) {
      createdAt = Instant.now();
    }
    if (updatedAt == null) {
      updatedAt = createdAt;
    }
  }
}
