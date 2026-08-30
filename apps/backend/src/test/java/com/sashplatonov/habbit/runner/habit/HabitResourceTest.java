package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.habit.dto.HabitCreateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitResponseDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitStatusUpdateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitUpdateRequestDto;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.model.HabitScheduleType;
import com.sashplatonov.habbit.runner.model.WeekOfMonthValue;
import com.sashplatonov.habbit.runner.support.TestHelpers;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HabitResourceTest {
  @Test
  void shouldCreateHabitWithConcreteDto() {
    var service = new StubHabitService();
    service.setResponse(com.sashplatonov.habbit.runner.api.OperationResult.success(response("habit-1")));
    var resource = resource(service);
    var request = HabitCreateRequestDto.builder()
        .id("habit-1")
        .name("Read")
        .color(HabitColor.BLUE)
        .icon("book")
        .frequency(HabitFrequency.DAILY)
        .targetStreak(1)
        .dailyTarget(1)
        .type(HabitType.POSITIVE)
        .build();

    var response = resource.create(request);

    assertEquals("user-1", service.getLastUserId());
    assertEquals(request, service.getLastCreateRequest());
    assertStatus(response, 201);
  }

  @Test
  void shouldValidateScheduleVariantsBeforeResourceServiceCanPersistThem() {
    try (var factory = Validation.buildDefaultValidatorFactory()) {
      var validator = factory.getValidator();

      assertInvalid(validator, createRequest(schedule(HabitScheduleType.WEEKLY_DAYS, List.of(), null, null, null)));
      assertInvalid(validator, updateRequest(schedule(HabitScheduleType.MONTHLY_WEEKS, List.of(1), null, null, List.of())));
      assertInvalid(validator, createRequest(schedule(HabitScheduleType.WEEKLY_QUOTA, null, 8, null, null)));
      assertInvalid(validator, createRequest(schedule(HabitScheduleType.MONTHLY_QUOTA, null, null, 32, null)));
    }
  }

  @Test
  void shouldAcceptValidSchedulesAndLegacyRequestsWithoutSchedule() {
    try (var factory = Validation.buildDefaultValidatorFactory()) {
      var validator = factory.getValidator();

      assertValid(validator, createRequest(schedule(HabitScheduleType.DAILY, null, null, null, null)));
      assertValid(validator, createRequest(schedule(HabitScheduleType.WEEKLY_DAYS, List.of(1, 3), null, null, null)));
      assertValid(validator, createRequest(schedule(HabitScheduleType.WEEKLY_QUOTA, null, 3, null, null)));
      assertValid(validator, createRequest(schedule(HabitScheduleType.MONTHLY_QUOTA, null, null, 12, null)));
      assertValid(validator, createRequest(schedule(HabitScheduleType.MONTHLY_WEEKS, List.of(2), null, null, List.of(WeekOfMonthValue.FIRST))));
      assertValid(validator, createRequest(null));
      assertValid(validator, updateRequest(null));
    }
  }

  private HabitCreateRequestDto createRequest(com.sashplatonov.habbit.runner.habit.dto.HabitScheduleDto schedule) {
    return HabitCreateRequestDto.builder()
        .id("habit-1")
        .name("Read")
        .color(HabitColor.BLUE)
        .icon("book")
        .frequency(HabitFrequency.DAILY)
        .targetStreak(1)
        .dailyTarget(1)
        .type(HabitType.POSITIVE)
        .schedule(schedule)
        .build();
  }

  private HabitUpdateRequestDto updateRequest(com.sashplatonov.habbit.runner.habit.dto.HabitScheduleDto schedule) {
    return HabitUpdateRequestDto.builder().schedule(schedule).build();
  }

  private com.sashplatonov.habbit.runner.habit.dto.HabitScheduleDto schedule(
      HabitScheduleType type,
      List<Integer> weekdays,
      Integer timesPerWeek,
      Integer timesPerMonth,
      List<WeekOfMonthValue> weeksOfMonth
  ) {
    return com.sashplatonov.habbit.runner.habit.dto.HabitScheduleDto.builder()
        .type(type)
        .weekdays(weekdays)
        .timesPerWeek(timesPerWeek)
        .timesPerMonth(timesPerMonth)
        .weeksOfMonth(weeksOfMonth)
        .build();
  }

  private void assertInvalid(Validator validator, Object request) {
    assertTrue(validator.validate(request).stream().anyMatch(violation -> violation.getPropertyPath().toString().contains("schedule")));
  }

  private void assertValid(Validator validator, Object request) {
    assertTrue(validator.validate(request).isEmpty());
  }

  @Test
  void shouldUpdateHabitWithConcreteDto() {
    var service = new StubHabitService();
    service.setResponse(com.sashplatonov.habbit.runner.api.OperationResult.success(response("habit-1")));
    var resource = resource(service);
    var request = HabitUpdateRequestDto.builder()
        .name("Read more")
        .archived(false)
        .build();

    var response = resource.update("habit-1", request);

    assertEquals("habit-1", service.getLastHabitId());
    assertEquals(request, service.getLastUpdateRequest());
    assertStatus(response, 200);
  }

  @Test
  void shouldUpdateHabitStatusWithConcreteDto() {
    var service = new StubHabitService();
    service.setResponse(com.sashplatonov.habbit.runner.api.OperationResult.success(response("habit-1")));
    var resource = resource(service);
    var request = HabitStatusUpdateRequestDto.builder().archived(true).build();

    var response = resource.updateStatus("habit-1", request);

    assertEquals("habit-1", service.getLastHabitId());
    assertEquals(request, service.getLastStatusRequest());
    assertStatus(response, 200);
  }

  @Test
  void shouldDeleteHabit() {
    var service = new StubHabitService();
    service.setDeleteResponse(com.sashplatonov.habbit.runner.api.OperationResult.success(null));
    var resource = resource(service);

    var response = resource.delete("habit-1");

    assertEquals("habit-1", service.getLastHabitId());
    assertStatus(response, 204);
  }

  private HabitResource resource(StubHabitService service) {
    var currentUserContext = new CurrentUserContext();
    currentUserContext.setUser(new CurrentUser("user-1", "user@example.test"));
    return new HabitResource(service, currentUserContext);
  }

  private HabitResponseDto response(String id) {
    return HabitResponseDto.builder()
        .id(id)
        .name("Read")
        .color(HabitColor.BLUE)
        .icon("book")
        .frequency(HabitFrequency.DAILY)
        .customDays(List.of())
        .targetStreak(1)
        .dailyTarget(1)
        .tags(List.of())
        .archived(false)
        .createdAt("2026-04-10T10:00:00Z")
        .updatedAt("2026-04-10T10:00:00Z")
        .version(1)
        .sortOrder(1L)
        .reminderEnabled(true)
        .type(HabitType.POSITIVE)
        .freezeDays(List.of())
        .build();
  }

  private void assertStatus(Response response, int status) {
    assertEquals(status, TestHelpers.statusOf(response));
  }
}
