package com.habittracker.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigInteger;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "habits",
    indexes = {
      @Index(name = "habits_user_updated_cursor_idx", columnList = "userId,updatedAt,id")
    }
)
public class HabitEntity extends PanacheEntityBase {
  @Id
  @Column(nullable = false)
  public String id;

  @Column(name = "userId", nullable = false)
  public String userId;

  @Column(nullable = false)
  public String name;

  @Column
  public String description;

  @Column(nullable = false)
  public String color;

  @Column(nullable = false)
  public String icon;

  @Column(nullable = false)
  public String frequency;

  @Column(name = "customDays", columnDefinition = "jsonb")
  @JdbcTypeCode(SqlTypes.JSON)
  public String customDays;

  @Column(name = "schedule", columnDefinition = "jsonb")
  @JdbcTypeCode(SqlTypes.JSON)
  public String schedule;

  @Column(name = "targetStreak", nullable = false)
  public int targetStreak;

  @Column(name = "dailyTarget", nullable = false)
  public int dailyTarget;

  @Column(columnDefinition = "jsonb")
  @JdbcTypeCode(SqlTypes.JSON)
  public String tags;

  @Column(nullable = false)
  public boolean archived;

  @Column(name = "sortOrder", nullable = false)
  public BigInteger sortOrder;

  @Column(name = "reminderTime")
  public String reminderTime;

  @Column(name = "reminderEnabled", nullable = false)
  public boolean reminderEnabled;

  @Column(name = "lastReminderSentAt")
  public Instant lastReminderSentAt;

  @Column(nullable = false)
  public String type;

  @Column(name = "freezeDays", columnDefinition = "jsonb")
  @JdbcTypeCode(SqlTypes.JSON)
  public String freezeDays;

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
    if (dailyTarget < 1) {
      dailyTarget = 1;
    }
    if (sortOrder == null) {
      sortOrder = BigInteger.ZERO;
    }
    if (type == null || type.isBlank()) {
      type = "positive";
    }
    if (freezeDays == null) {
      freezeDays = "[]";
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
