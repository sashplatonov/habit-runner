package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.MappedSuperclass;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@MappedSuperclass
public abstract class HabitIdentityFields extends UuidAuditedEntityBase {
  @Column(name = "userId", nullable = false)
  public String userId;

  @Column(nullable = false)
  public String name;

  @Column
  public String description;

  @Column(nullable = false)
  @Convert(converter = HabitColorConverter.class)
  public HabitColor color;

  @Column(nullable = false)
  public String icon;

  @Column(nullable = false)
  @Convert(converter = HabitFrequencyConverter.class)
  public HabitFrequency frequency;

  @Column(name = "customDays", columnDefinition = "jsonb")
  @JdbcTypeCode(SqlTypes.JSON)
  public String customDays;

  @Column(name = "schedule", columnDefinition = "jsonb")
  @JdbcTypeCode(SqlTypes.JSON)
  public String schedule;
}
