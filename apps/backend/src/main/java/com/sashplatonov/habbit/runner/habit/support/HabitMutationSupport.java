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
    if (habit.getColor() == null) {
      habit.setColor(HabitColor.BLUE);
    }
    if (habit.getIcon() == null) {
      habit.setIcon(DEFAULT_ICON);
    }
    if (habit.getFrequency() == null) {
      habit.setFrequency(HabitFrequency.DAILY);
    }
    if (habit.getTargetStreak() < 1) {
      habit.setTargetStreak(1);
    }
    if (habit.getDailyTarget() < 1) {
      habit.setDailyTarget(1);
    }
    if (habit.getSortOrder() == null) {
      habit.setSortOrder(BigInteger.ZERO);
    }
    if (habit.getType() == null) {
      habit.setType(HabitType.POSITIVE);
    }
    if (habit.getCustomDays() == null) {
      habit.setCustomDays(List.of());
    }
    if (habit.getTags() == null) {
      habit.setTags(List.of());
    }
    if (habit.getFreezeDays() == null) {
      habit.setFreezeDays(List.of());
    }
    if (habit.getVersion() < 1) {
      habit.setVersion(1);
    }
  }

  public static void touch(HabitEntity habit) {
    habit.setUpdatedAt(Instant.now());
    habit.setVersion(Math.max(1, habit.getVersion()) + 1);
  }
}
