package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigInteger;

@Entity
@Table(
    name = "habits",
    indexes = {
      @Index(name = "habits_user_updated_cursor_idx", columnList = "userId,updatedAt,id")
    }
)
public class HabitEntity extends HabitSettingsFields {
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
    setFreezeDays(defaultFreezeDays(getFreezeDays()));
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

  private String defaultFreezeDays(String value) {
    return value != null ? value : "[]";
  }
}
