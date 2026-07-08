package com.sashplatonov.habbit.runner.habit.support;

import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;

import java.math.BigInteger;
import java.time.Instant;
import java.util.List;

public final class HabitMutationSupport {
  private static final String DEFAULT_ICON = "star";

  private HabitMutationSupport() {
  }

  public static void normalize(HabitEntity habit) {
    applyScalarDefaults(habit);
    applyCollectionDefaults(habit);
    applyVersionDefault(habit);
  }

  private static void applyScalarDefaults(HabitEntity habit) {
    applyColorDefault(habit);
    applyIconDefault(habit);
    applyFrequencyDefault(habit);
    applyTargetDefaults(habit);
    applySortOrderDefault(habit);
    applyTypeDefault(habit);
  }

  private static void applyCollectionDefaults(HabitEntity habit) {
    if (habit.getCustomDays() == null) {
      habit.setCustomDays(List.of());
    }
    if (habit.getTags() == null) {
      habit.setTags(List.of());
    }
    if (habit.getFreezeDays() == null) {
      habit.setFreezeDays(List.of());
    }
  }

  private static void applyVersionDefault(HabitEntity habit) {
    if (habit.getVersion() < 1) {
      habit.setVersion(1);
    }
  }

  public static void touch(HabitEntity habit) {
    habit.setUpdatedAt(Instant.now());
    habit.setVersion(Math.max(1, habit.getVersion()) + 1);
  }

  private static void applyColorDefault(HabitEntity habit) {
    if (habit.getColor() == null) {
      habit.setColor(HabitColor.BLUE);
    }
  }

  private static void applyIconDefault(HabitEntity habit) {
    if (habit.getIcon() == null) {
      habit.setIcon(DEFAULT_ICON);
    }
  }

  private static void applyFrequencyDefault(HabitEntity habit) {
    if (habit.getFrequency() == null) {
      habit.setFrequency(HabitFrequency.DAILY);
    }
  }

  private static void applyTargetDefaults(HabitEntity habit) {
    if (habit.getTargetStreak() < 1) {
      habit.setTargetStreak(1);
    }
    if (habit.getDailyTarget() < 1) {
      habit.setDailyTarget(1);
    }
  }

  private static void applySortOrderDefault(HabitEntity habit) {
    if (habit.getSortOrder() == null) {
      habit.setSortOrder(BigInteger.ZERO);
    }
  }

  private static void applyTypeDefault(HabitEntity habit) {
    if (habit.getType() == null) {
      habit.setType(HabitType.POSITIVE);
    }
  }
}
