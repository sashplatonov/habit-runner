package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.habit.dto.HabitCreateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitResponseDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitScheduleDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitUpdateRequestDto;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitScheduleType;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.model.WeekOfMonthValue;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.math.BigInteger;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class HabitMapperTest {
  private final HabitMapper habitMapper = Mappers.getMapper(HabitMapper.class);

  @Test
  void shouldApplyCreateAndMapResponseWithSchedule() {
    var entity = new HabitEntity();
    var schedule = HabitScheduleDto.builder()
        .type(HabitScheduleType.WEEKLY_DAYS)
        .weekdays(List.of(1, 3, 5))
        .timesPerWeek(3)
        .timesPerMonth(12)
        .weeksOfMonth(List.of(WeekOfMonthValue.FIRST))
        .build();
    var request = HabitCreateRequestDto.builder()
        .id("habit-1")
        .name("Read")
        .description("Daily reading")
        .color(HabitColor.BLUE)
        .icon("book")
        .frequency(HabitFrequency.WEEKDAYS)
        .customDays(List.of(1, 3, 5))
        .schedule(schedule)
        .targetStreak(7)
        .dailyTarget(2)
        .tags(List.of("focus"))
        .archived(true)
        .sortOrder(11L)
        .reminderTime("07:30")
        .reminderEnabled(true)
        .type(HabitType.POSITIVE)
        .freezeDays(List.of("2026-04-10"))
        .build();

    habitMapper.applyCreate(request, entity);
    entity.setId("habit-1");
    entity.setUserId("user-1");
    entity.setCreatedAt(Instant.parse("2026-04-10T10:00:00Z"));
    entity.setUpdatedAt(Instant.parse("2026-04-10T10:05:00Z"));
    entity.setVersion(1);
    entity.setSortOrder(BigInteger.valueOf(11));

    assertEquals("Read", entity.name);
    assertEquals(HabitScheduleType.WEEKLY_DAYS, entity.getScheduleType());
    assertEquals(List.of(1, 3, 5), entity.getScheduleWeekdays());
    assertEquals(3, entity.getScheduleTimesPerWeek());

    var response = habitMapper.toResponse(entity);
    assertEquals("habit-1", response.id());
    assertEquals("Read", response.name());
    assertEquals("Daily reading", response.description());
    assertEquals(HabitScheduleType.WEEKLY_DAYS, response.schedule().type());
    assertEquals(List.of(1, 3, 5), response.schedule().weekdays());
    assertEquals(List.of("2026-04-10"), response.freezeDays());
  }

  @Test
  void shouldApplyCreateWithoutScheduleAndClearExistingCollections() {
    var entity = new HabitEntity();
    entity.setScheduleWeekdays(new ArrayList<>(List.of(1)));
    entity.setScheduleWeeksOfMonth(new ArrayList<>(List.of(WeekOfMonthValue.FIRST)));
    entity.setCustomDays(new ArrayList<>(List.of(7)));
    entity.setTags(new ArrayList<>(List.of("focus")));
    entity.setFreezeDays(new ArrayList<>(List.of("2026-04-10")));

    var request = HabitCreateRequestDto.builder()
        .id("habit-2")
        .name("Walk")
        .color(HabitColor.GREEN)
        .icon("walk")
        .frequency(HabitFrequency.DAILY)
        .targetStreak(1)
        .dailyTarget(1)
        .type(HabitType.POSITIVE)
        .build();

    habitMapper.applyCreate(request, entity);

    assertEquals("Walk", entity.name);
    assertNull(entity.getScheduleType());
    assertNull(entity.getScheduleWeekdays());
    assertNull(entity.getScheduleWeeksOfMonth());
    assertNull(entity.getCustomDays());
    assertNull(entity.getTags());
    assertNull(entity.getFreezeDays());
  }

  @Test
  void shouldApplyUpdateWithScheduleAndReplaceCollections() {
    var entity = new HabitEntity();
    entity.setScheduleType(HabitScheduleType.DAILY);
    entity.setScheduleWeekdays(new ArrayList<>(List.of(1)));
    entity.setScheduleWeeksOfMonth(new ArrayList<>(List.of(WeekOfMonthValue.FIRST)));
    entity.setCustomDays(new ArrayList<>(List.of(7)));
    entity.setTags(new ArrayList<>(List.of("focus")));
    entity.setFreezeDays(new ArrayList<>(List.of("2026-04-10")));
    entity.setName("Read");
    entity.setDescription("Daily reading");
    entity.setColor(HabitColor.BLUE);
    entity.setIcon("book");
    entity.setFrequency(HabitFrequency.DAILY);
    entity.setTargetStreak(7);
    entity.setDailyTarget(2);
    entity.setArchived(false);
    entity.setSortOrder(BigInteger.valueOf(11));
    entity.setReminderTime("07:30");
    entity.setReminderEnabled(true);
    entity.setType(HabitType.POSITIVE);

    var schedule = HabitScheduleDto.builder()
        .type(HabitScheduleType.WEEKLY_DAYS)
        .weekdays(List.of(1, 3, 5))
        .timesPerWeek(3)
        .timesPerMonth(12)
        .weeksOfMonth(List.of(WeekOfMonthValue.FIRST, WeekOfMonthValue.THIRD))
        .build();
    var request = HabitUpdateRequestDto.builder()
        .name("Read more")
        .description("Updated reading plan")
        .color(HabitColor.GREEN)
        .icon("book-open")
        .frequency(HabitFrequency.WEEKDAYS)
        .customDays(List.of(2, 4))
        .schedule(schedule)
        .targetStreak(9)
        .dailyTarget(4)
        .tags(List.of("focus", "health"))
        .archived(true)
        .sortOrder(21L)
        .reminderTime("08:15")
        .reminderEnabled(false)
        .type(HabitType.NEGATIVE)
        .freezeDays(List.of("2026-04-11"))
        .build();

    habitMapper.applyUpdate(request, entity);

    assertEquals("Read more", entity.name);
    assertEquals("Updated reading plan", entity.description);
    assertEquals(HabitColor.GREEN, entity.color);
    assertEquals("book-open", entity.icon);
    assertEquals(HabitFrequency.WEEKDAYS, entity.frequency);
    assertEquals(List.of(2, 4), entity.getCustomDays());
    assertEquals(HabitScheduleType.WEEKLY_DAYS, entity.getScheduleType());
    assertEquals(List.of(1, 3, 5), entity.getScheduleWeekdays());
    assertEquals(3, entity.getScheduleTimesPerWeek());
    assertEquals(12, entity.getScheduleTimesPerMonth());
    assertEquals(List.of(WeekOfMonthValue.FIRST, WeekOfMonthValue.THIRD), entity.getScheduleWeeksOfMonth());
    assertEquals(9, entity.targetStreak);
    assertEquals(4, entity.dailyTarget);
    assertEquals(List.of("focus", "health"), entity.getTags());
    assertEquals(true, entity.archived);
    assertEquals(BigInteger.valueOf(21), entity.getSortOrder());
    assertEquals("08:15", entity.reminderTime);
    assertEquals(false, entity.reminderEnabled);
    assertEquals(HabitType.NEGATIVE, entity.type);
    assertEquals(List.of("2026-04-11"), entity.getFreezeDays());
  }

  @Test
  void shouldApplyUpdateWithoutClearingExistingValues() {
    var entity = new HabitEntity();
    entity.setId("habit-1");
    entity.setUserId("user-1");
    entity.name = "Read";
    entity.description = "Daily reading";
    entity.color = HabitColor.BLUE;
    entity.icon = "book";
    entity.frequency = HabitFrequency.DAILY;
    entity.targetStreak = 7;
    entity.dailyTarget = 2;
    entity.tags = List.of("focus");
    entity.archived = false;
    entity.sortOrder = BigInteger.valueOf(11);
    entity.reminderTime = "07:30";
    entity.reminderEnabled = true;
    entity.type = HabitType.POSITIVE;
    entity.freezeDays = List.of("2026-04-10");
    entity.setScheduleType(HabitScheduleType.DAILY);
    entity.setScheduleWeekdays(List.of());

    var request = HabitUpdateRequestDto.builder()
        .name("Read more")
        .archived(true)
        .build();

    habitMapper.applyUpdate(request, entity);

    assertEquals("Read more", entity.name);
    assertEquals("Daily reading", entity.description);
    assertEquals(HabitColor.BLUE, entity.color);
    assertEquals(true, entity.archived);
    assertNull(habitMapper.toResponse(new HabitEntity()).schedule());
  }
}
