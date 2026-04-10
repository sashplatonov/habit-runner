package com.habittracker.model;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@MappedSuperclass
public abstract class HabitIdentityFields extends PanacheEntityBase {
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
