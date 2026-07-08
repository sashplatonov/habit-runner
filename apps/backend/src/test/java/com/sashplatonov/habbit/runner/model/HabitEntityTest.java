package com.sashplatonov.habbit.runner.model;

import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class HabitEntityTest {

  @Test
  void shouldNormalizeMissingFieldsOnPrePersist() {
    var habit = new HabitEntity();

    habit.prePersist();

    assertEquals(HabitColor.BLUE, habit.getColor());
    assertEquals("star", habit.getIcon());
    assertEquals(HabitFrequency.DAILY, habit.getFrequency());
    assertEquals(1, habit.getTargetStreak());
    assertEquals(1, habit.getDailyTarget());
    assertEquals(BigInteger.ZERO, habit.getSortOrder());
    assertEquals(HabitType.POSITIVE, habit.getType());
    assertEquals(List.of(), habit.getCustomDays());
    assertEquals(List.of(), habit.getTags());
    assertEquals(List.of(), habit.getFreezeDays());
    assertEquals(1, habit.getVersion());
  }

  @Test
  void shouldReturnZeroSortOrderWhenMissing() {
    var habit = new HabitEntity();

    assertEquals(BigInteger.ZERO, habit.sortOrderOrZero());
  }

  @Test
  void shouldReturnExistingSortOrderWhenPresent() {
    var habit = new HabitEntity();
    habit.setSortOrder(BigInteger.valueOf(42));

    assertEquals(BigInteger.valueOf(42), habit.sortOrderOrZero());
  }

  @Test
  void shouldLeaveNullableFieldsUnsetBeforePersist() {
    var habit = new HabitEntity();

    assertNull(habit.getDescription());
    assertNull(habit.getReminderTime());
    assertNull(habit.getLastReminderSentAt());
    assertNull(habit.getScheduleType());
  }
}
