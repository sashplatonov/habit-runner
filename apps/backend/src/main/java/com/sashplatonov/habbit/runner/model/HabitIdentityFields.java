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

  // Getters and setters for backward compatibility
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public HabitColor getColor() { return color; }
  public void setColor(HabitColor color) { this.color = color; }
  public String getIcon() { return icon; }
  public void setIcon(String icon) { this.icon = icon; }
  public HabitFrequency getFrequency() { return frequency; }
  public void setFrequency(HabitFrequency frequency) { this.frequency = frequency; }
  public String getCustomDays() { return customDays; }
  public void setCustomDays(String customDays) { this.customDays = customDays; }
  public String getSchedule() { return schedule; }
  public void setSchedule(String schedule) { this.schedule = schedule; }
}
