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
}

