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
  void prePersist() {
    ensureId();
    initializeDefaults();
    initializeAuditFields();
  }

  private void initializeDefaults() {
    dailyTarget = Math.max(1, dailyTarget);
    sortOrder = defaultSortOrder(sortOrder);
    color = defaultColor(color);
    frequency = defaultFrequency(frequency);
    type = defaultType(type);
    freezeDays = defaultFreezeDays(freezeDays);
    version = Math.max(1, version);
  }

  private void initializeAuditFields() {
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

  private BigInteger defaultSortOrder(BigInteger value) {
    return value != null ? value : BigInteger.ZERO;
  }

  private HabitColor defaultColor(HabitColor value) {
    return value != null ? value : HabitColor.BLUE;
  }

  private HabitFrequency defaultFrequency(HabitFrequency value) {
    return value != null ? value : HabitFrequency.DAILY;
  }

  private HabitType defaultType(HabitType value) {
    return value != null ? value : HabitType.POSITIVE;
  }

  private String defaultFreezeDays(String value) {
    return value != null ? value : "[]";
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

  public void setColor(HabitColor value) {
    color = value;
  }

  public void setFrequency(HabitFrequency value) {
    frequency = value;
  }

  public void setType(HabitType value) {
    type = value;
  }
}
