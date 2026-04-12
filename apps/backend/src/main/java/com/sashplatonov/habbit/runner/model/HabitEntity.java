package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
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
public class HabitEntity extends HabitSettingsFields {
  @Column(name = "createdAt", nullable = false)
  public Instant createdAt;

  @Column(name = "updatedAt", nullable = false)
  public Instant updatedAt;

  @Column(nullable = false)
  public int version;

  @PrePersist
  @SuppressWarnings({"PMD.CyclomaticComplexity", "PMD.NPathComplexity"})
  void prePersist() {
    ensureId();
    dailyTarget = Math.max(1, dailyTarget);
    sortOrder = sortOrder != null ? sortOrder : BigInteger.ZERO;
    color = color != null ? color : HabitColor.BLUE;
    frequency = frequency != null ? frequency : HabitFrequency.DAILY;
    type = type != null ? type : HabitType.POSITIVE;
    freezeDays = freezeDays != null ? freezeDays : "[]";
    version = Math.max(1, version);
    createdAt = createdAt != null ? createdAt : Instant.now();
    updatedAt = updatedAt != null ? updatedAt : createdAt;
  }

  private void ensureId() {
    if (!hasText(id)) {
      id = UUID.randomUUID().toString();
    }
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  public BigInteger sortOrderOrZero() {
    return sortOrder != null ? sortOrder : BigInteger.ZERO;
  }

  public Instant createdAtValue() {
    return createdAt;
  }

  public Instant updatedAtValue() {
    return updatedAt;
  }

  public int versionValue() {
    return version;
  }

  public void setCreatedAt(Instant instant) {
    createdAt = instant;
  }

  public void setUpdatedAt(Instant instant) {
    updatedAt = instant;
  }

  public void setSortOrder(BigInteger value) {
    sortOrder = value;
  }
}
