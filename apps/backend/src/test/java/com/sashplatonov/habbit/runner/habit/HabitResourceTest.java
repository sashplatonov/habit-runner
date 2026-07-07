package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.auth.CurrentUser;
import com.sashplatonov.habbit.runner.auth.CurrentUserContext;
import com.sashplatonov.habbit.runner.habit.dto.HabitCreateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitResponseDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitStatusUpdateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitUpdateRequestDto;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.support.TestHelpers;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

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
