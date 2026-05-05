package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigInteger;
import java.time.Instant;

@MappedSuperclass
@Getter
@Setter
public abstract class HabitSettingsFields extends HabitIdentityFields {
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
  @JdbcTypeCode(SqlTypes.BIGINT)
  public BigInteger sortOrder;

  @Column(name = "reminderTime")
  public String reminderTime;

  @Column(name = "reminderEnabled", nullable = false)
  public boolean reminderEnabled;

  @Column(name = "lastReminderSentAt")
  public Instant lastReminderSentAt;

  @Column(nullable = false)
  @Convert(converter = HabitTypeConverter.class)
  public HabitType type;

  @Column(name = "freezeDays", columnDefinition = "jsonb")
  @JdbcTypeCode(SqlTypes.JSON)
  public String freezeDays;

  @Column(nullable = false)
  public int version;

  // Getters and setters for backward compatibility
  public int getTargetStreak() { return targetStreak; }
  public void setTargetStreak(int targetStreak) { this.targetStreak = targetStreak; }
  public int getDailyTarget() { return dailyTarget; }
  public void setDailyTarget(int dailyTarget) { this.dailyTarget = dailyTarget; }
  public String getTags() { return tags; }
  public void setTags(String tags) { this.tags = tags; }
  public boolean isArchived() { return archived; }
  public void setArchived(boolean archived) { this.archived = archived; }
  public BigInteger getSortOrder() { return sortOrder; }
  public void setSortOrder(BigInteger sortOrder) { this.sortOrder = sortOrder; }
  public String getReminderTime() { return reminderTime; }
  public void setReminderTime(String reminderTime) { this.reminderTime = reminderTime; }
  public boolean isReminderEnabled() { return reminderEnabled; }
  public void setReminderEnabled(boolean reminderEnabled) { this.reminderEnabled = reminderEnabled; }
  public Instant getLastReminderSentAt() { return lastReminderSentAt; }
  public void setLastReminderSentAt(Instant lastReminderSentAt) { this.lastReminderSentAt = lastReminderSentAt; }
  public HabitType getType() { return type; }
  public void setType(HabitType type) { this.type = type; }
  public String getFreezeDays() { return freezeDays; }
  public void setFreezeDays(String freezeDays) { this.freezeDays = freezeDays; }
  public int getVersion() { return version; }
  public void setVersion(int version) { this.version = version; }
}


