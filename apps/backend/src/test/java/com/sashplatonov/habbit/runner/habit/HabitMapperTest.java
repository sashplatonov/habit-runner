package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.habit.dto.HabitCreateRequestDto;
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
    var entity = applyCreateWithSchedule();

    assertEquals("Read", entity.getName());
    assertEquals(HabitScheduleType.WEEKLY_DAYS, entity.getScheduleType());
    assertEquals(List.of(1, 3, 5), entity.getScheduleWeekdays());
    assertEquals(3, entity.getScheduleTimesPerWeek());
  }

  @Test
  void shouldMapResponseWithSchedule() {
    var entity = applyCreateWithSchedule();

    var response = habitMapper.toResponse(entity);
    assertEquals("habit-1", response.id());
    assertEquals("Read", response.name());
    assertEquals("Daily reading", response.description());
    assertEquals(HabitScheduleType.WEEKLY_DAYS, response.schedule().type());
    assertEquals(List.of(1, 3, 5), response.schedule().weekdays());
    assertEquals(List.of("2026-04-10"), response.freezeDays());

    entity.getCustomDays().add(7);
    entity.getTags().add("health");
    entity.getFreezeDays().add("2026-04-11");
    entity.getScheduleWeekdays().add(6);
    entity.getScheduleWeeksOfMonth().add(WeekOfMonthValue.LAST);

    assertEquals(List.of(1, 3, 5), response.customDays());
    assertEquals(List.of("focus"), response.tags());
    assertEquals(List.of("2026-04-10"), response.freezeDays());
    assertEquals(List.of(1, 3, 5), response.schedule().weekdays());
    assertEquals(List.of(WeekOfMonthValue.FIRST), response.schedule().weeksOfMonth());
  }

  private HabitEntity applyCreateWithSchedule() {
    var entity = new HabitEntity();
    var customDays = new ArrayList<>(List.of(1, 3, 5));
    var tags = new ArrayList<>(List.of("focus"));
    var freezeDays = new ArrayList<>(List.of("2026-04-10"));
    var scheduleWeekdays = new ArrayList<>(List.of(1, 3, 5));
    var scheduleWeeksOfMonth = new ArrayList<>(List.of(WeekOfMonthValue.FIRST));
    var schedule = HabitScheduleDto.builder()
        .type(HabitScheduleType.WEEKLY_DAYS)
        .weekdays(scheduleWeekdays)
        .timesPerWeek(3)
        .timesPerMonth(12)
        .weeksOfMonth(scheduleWeeksOfMonth)
        .build();
    var request = HabitCreateRequestDto.builder()
        .id("habit-1")
        .name("Read")
        .description("Daily reading")
        .color(HabitColor.BLUE)
        .icon("book")
        .frequency(HabitFrequency.WEEKDAYS)
        .customDays(customDays)
        .schedule(schedule)
        .targetStreak(7)
        .dailyTarget(2)
        .tags(tags)
        .archived(true)
        .sortOrder(11L)
        .reminderTime("07:30")
        .reminderEnabled(true)
        .type(HabitType.POSITIVE)
        .freezeDays(freezeDays)
        .build();

    habitMapper.applyCreate(request, entity);
    entity.setId("habit-1");
    entity.setUserId("user-1");
    entity.setCreatedAt(Instant.parse("2026-04-10T10:00:00Z"));
    entity.setUpdatedAt(Instant.parse("2026-04-10T10:05:00Z"));
    entity.setVersion(1);
    entity.setSortOrder(BigInteger.valueOf(11));
    entity.setCustomDays(new ArrayList<>(entity.getCustomDays()));
    entity.setTags(new ArrayList<>(entity.getTags()));
    entity.setFreezeDays(new ArrayList<>(entity.getFreezeDays()));
    entity.setScheduleWeekdays(new ArrayList<>(entity.getScheduleWeekdays()));
    entity.setScheduleWeeksOfMonth(new ArrayList<>(entity.getScheduleWeeksOfMonth()));
    return entity;
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

    assertEquals("Walk", entity.getName());
    assertNull(entity.getScheduleType());
    assertNull(entity.getScheduleWeekdays());
    assertNull(entity.getScheduleWeeksOfMonth());
    assertNull(entity.getCustomDays());
    assertNull(entity.getTags());
    assertNull(entity.getFreezeDays());
  }

  @Test
  void shouldApplyUpdateWithScheduleAndReplaceCollections() {
    var entity = applyUpdateWithSchedule();

    assertEquals("Read more", entity.getName());
    assertEquals("Updated reading plan", entity.getDescription());
    assertEquals(HabitColor.GREEN, entity.getColor());
    assertEquals("book-open", entity.getIcon());
    assertEquals(HabitFrequency.WEEKDAYS, entity.getFrequency());
    assertEquals(List.of(2, 4), entity.getCustomDays());
    assertEquals(HabitScheduleType.WEEKLY_DAYS, entity.getScheduleType());
    assertEquals(List.of(1, 3, 5), entity.getScheduleWeekdays());
    assertEquals(3, entity.getScheduleTimesPerWeek());
    assertEquals(12, entity.getScheduleTimesPerMonth());
    assertEquals(List.of(WeekOfMonthValue.FIRST, WeekOfMonthValue.THIRD), entity.getScheduleWeeksOfMonth());
    assertEquals(9, entity.getTargetStreak());
    assertEquals(4, entity.getDailyTarget());
    assertEquals(List.of("focus", "health"), entity.getTags());
    assertEquals(true, entity.isArchived());
    assertEquals(BigInteger.valueOf(21), entity.getSortOrder());
    assertEquals("08:15", entity.getReminderTime());
    assertEquals(false, entity.isReminderEnabled());
    assertEquals(HabitType.NEGATIVE, entity.getType());
    assertEquals(List.of("2026-04-11"), entity.getFreezeDays());
  }

  private HabitEntity applyUpdateWithSchedule() {
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
    return entity;
  }

  @Test
  void shouldApplyUpdateWithoutClearingExistingValues() {
    var entity = new HabitEntity();
    entity.setId("habit-1");
    entity.setUserId("user-1");
    entity.setName("Read");
    entity.setDescription("Daily reading");
    entity.setColor(HabitColor.BLUE);
    entity.setIcon("book");
    entity.setFrequency(HabitFrequency.DAILY);
    entity.setTargetStreak(7);
    entity.setDailyTarget(2);
    entity.setTags(List.of("focus"));
    entity.setArchived(false);
    entity.setSortOrder(BigInteger.valueOf(11));
    entity.setReminderTime("07:30");
    entity.setReminderEnabled(true);
    entity.setType(HabitType.POSITIVE);
    entity.setFreezeDays(List.of("2026-04-10"));
    entity.setScheduleType(HabitScheduleType.DAILY);
    entity.setScheduleWeekdays(List.of());

    var request = HabitUpdateRequestDto.builder()
        .name("Read more")
        .archived(true)
        .build();

    habitMapper.applyUpdate(request, entity);

    assertEquals("Read more", entity.getName());
    assertEquals("Daily reading", entity.getDescription());
    assertEquals(HabitColor.BLUE, entity.getColor());
    assertEquals(true, entity.isArchived());
    assertNull(habitMapper.toResponse(new HabitEntity()).schedule());
  }
}
