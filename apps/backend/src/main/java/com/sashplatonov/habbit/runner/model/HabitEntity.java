package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigInteger;
import java.util.List;

@Entity
@Table(
    name = "habits",
    indexes = {
      @Index(name = "habits_user_updated_cursor_idx", columnList = "userId,updatedAt,id")
    }
)
@Getter
@Setter
public class HabitEntity extends UuidAuditedEntityBase {
  @Column(name = "userId", nullable = false)
  public String userId;

  @Column(nullable = false)
  public String name;

  @Column
  public String description;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  public HabitColor color;

  @Column(nullable = false)
  public String icon;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  public HabitFrequency frequency;

  @ElementCollection
  @CollectionTable(name = "habit_custom_days", joinColumns = @JoinColumn(name = "habit_id"))
  @OrderColumn(name = "position_index")
  @Column(name = "day_value", nullable = false)
  public List<Integer> customDays;

  @Column(name = "schedule_type")
  @Enumerated(EnumType.STRING)
  public HabitScheduleType scheduleType;

  @Column(name = "schedule_times_per_week")
  public Integer scheduleTimesPerWeek;

  @Column(name = "schedule_times_per_month")
  public Integer scheduleTimesPerMonth;

  @ElementCollection
  @CollectionTable(name = "habit_schedule_weekdays", joinColumns = @JoinColumn(name = "habit_id"))
  @OrderColumn(name = "position_index")
  @Column(name = "weekday_value", nullable = false)
  public List<Integer> scheduleWeekdays;

  @ElementCollection(targetClass = WeekOfMonthValue.class)
  @CollectionTable(name = "habit_schedule_weeks_of_month", joinColumns = @JoinColumn(name = "habit_id"))
  @OrderColumn(name = "position_index")
  @Enumerated(EnumType.STRING)
  @Column(name = "week_value", nullable = false)
  public List<WeekOfMonthValue> scheduleWeeksOfMonth;

  @Column(name = "targetStreak", nullable = false)
  public int targetStreak;

  @Column(name = "dailyTarget", nullable = false)
  public int dailyTarget;

  @ElementCollection
  @CollectionTable(name = "habit_tags", joinColumns = @JoinColumn(name = "habit_id"))
  @OrderColumn(name = "position_index")
  @Column(name = "tag_value", nullable = false)
  public List<String> tags;

  @Column(nullable = false)
  public boolean archived;

  @Column(name = "sortOrder", nullable = false)
  public BigInteger sortOrder;

  @Column(name = "reminderTime")
  public String reminderTime;

  @Column(name = "reminderEnabled", nullable = false)
  public boolean reminderEnabled;

  @Column(name = "lastReminderSentAt")
  public java.time.Instant lastReminderSentAt;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  public HabitType type;

  @ElementCollection
  @CollectionTable(name = "habit_freeze_days", joinColumns = @JoinColumn(name = "habit_id"))
  @OrderColumn(name = "position_index")
  @Column(name = "freeze_day_value", nullable = false)
  public List<String> freezeDays;

  @Column(nullable = false)
  public int version;

  @PrePersist
  void prePersist() {
    initializeDefaults();
  }

  private void initializeDefaults() {
    setDailyTarget(Math.max(1, getDailyTarget()));
    setSortOrder(defaultSortOrder(getSortOrder()));
    setColor(defaultColor(getColor()));
    setFrequency(defaultFrequency(getFrequency()));
    setType(defaultType(getType()));
    setCustomDays(defaultCustomDays(getCustomDays()));
    setFreezeDays(defaultFreezeDays(getFreezeDays()));
    setTags(defaultTags(getTags()));
    setVersion(Math.max(1, getVersion()));
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

  private List<Integer> defaultCustomDays(List<Integer> value) {
    return value != null ? value : List.of();
  }

  private List<String> defaultTags(List<String> value) {
    return value != null ? value : List.of();
  }

  private List<String> defaultFreezeDays(List<String> value) {
    return value != null ? value : List.of();
  }

  public BigInteger sortOrderOrZero() {
    return getSortOrder() != null ? getSortOrder() : BigInteger.ZERO;
  }

  public int versionValue() {
    return getVersion();
  }
}
