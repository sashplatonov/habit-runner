package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.api.OperationFailure;
import com.sashplatonov.habbit.runner.api.OperationResult;
import com.sashplatonov.habbit.runner.api.OperationSuccess;
import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.habit.HabitMapper;
import com.sashplatonov.habbit.runner.habit.HabitServiceImpl;
import com.sashplatonov.habbit.runner.habit.dto.HabitCreateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitResponseDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitStatusUpdateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitUpdateRequestDto;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetricsInstrumentation;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;

import java.util.List;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HabitServiceImplTest {
  private final HabitRepository habitRepository = mock(HabitRepository.class);
  private final CheckinRepository checkinRepository = mock(CheckinRepository.class);
  private final HabitMapper habitMapper = mock(HabitMapper.class);
  private final ServiceMetricsInstrumentation metrics = mock(ServiceMetricsInstrumentation.class);
  private final HabitServiceImpl service = new HabitServiceImpl(habitRepository, checkinRepository, habitMapper, metrics);

  @BeforeEach
  void setUp() {
    when(metrics.measureMutation(ArgumentMatchers.<Supplier<OperationResult<?>> >any()))
        .thenAnswer(invocation -> invocation.<Supplier<OperationResult<?>>>getArgument(0).get());
    doAnswer(invocation -> null).when(habitMapper).applyCreate(ArgumentMatchers.any(), ArgumentMatchers.any());
    doAnswer(invocation -> null).when(habitMapper).applyUpdate(ArgumentMatchers.any(), ArgumentMatchers.any());
    when(habitMapper.toResponse(ArgumentMatchers.any())).thenReturn(response("habit-1"));
  }

  @Test
  void shouldCreateHabitWhenIdIsFree() {
    var request = HabitCreateRequestDto.builder()
        .id("habit-1")
        .name("Read")
        .color(com.sashplatonov.habbit.runner.model.HabitColor.BLUE)
        .icon("book")
        .frequency(HabitFrequency.DAILY)
        .targetStreak(1)
        .dailyTarget(1)
        .type(HabitType.POSITIVE)
        .build();
    when(habitRepository.findHabitById("habit-1")).thenReturn(null);

    var result = service.create("user-1", request);

    assertInstanceOf(OperationSuccess.class, result);
    verify(habitRepository).save(ArgumentMatchers.any(HabitEntity.class));
  }

  @Test
  void shouldRejectCreateWhenHabitBelongsToAnotherUser() {
    var existing = new HabitEntity();
    existing.setUserId("other-user");
    when(habitRepository.findHabitById("habit-1")).thenReturn(existing);

    var result = service.create("user-1", createRequest());

    var failure = assertInstanceOf(OperationFailure.class, result);
    assertEquals(409, failure.toErrorResponse().status());
    verify(habitRepository, never()).save(ArgumentMatchers.any());
  }

  @Test
  void shouldRejectCreateWhenHabitAlreadyExistsForOwner() {
    var existing = new HabitEntity();
    existing.setUserId("user-1");
    when(habitRepository.findHabitById("habit-1")).thenReturn(existing);

    var result = service.create("user-1", createRequest());

    var failure = assertInstanceOf(OperationFailure.class, result);
    assertEquals("HABIT_CONFLICT", failure.toErrorResponse().errorCode());
    verify(habitRepository, never()).save(ArgumentMatchers.any());
  }

  @Test
  void shouldUpdateStatusAndDeleteHabitForOwner() {
    var existing = new HabitEntity();
    existing.setId("habit-1");
    existing.setUserId("user-1");
    existing.setArchived(false);
    when(habitRepository.findByIdAndUserId("habit-1", "user-1")).thenReturn(existing);
    when(habitRepository.deleteByIdAndUserId("habit-1", "user-1")).thenReturn(1L);
    when(checkinRepository.deleteByHabitIdAndUserId("habit-1", "user-1")).thenReturn(1L);

    var updateResult = service.update("user-1", "habit-1", HabitUpdateRequestDto.builder().name("Read more").build());
    var statusResult = service.updateStatus("user-1", "habit-1", HabitStatusUpdateRequestDto.builder().archived(true).build());
    var deleteResult = service.delete("user-1", "habit-1");

    assertInstanceOf(OperationSuccess.class, updateResult);
    assertInstanceOf(OperationSuccess.class, statusResult);
    assertInstanceOf(OperationSuccess.class, deleteResult);
    verify(checkinRepository).deleteByHabitIdAndUserId("habit-1", "user-1");
    verify(habitRepository).deleteByIdAndUserId("habit-1", "user-1");
  }

  @Test
  void shouldReturnNotFoundWhenHabitIsMissing() {
    when(habitRepository.findByIdAndUserId("habit-1", "user-1")).thenReturn(null);
    when(habitRepository.deleteByIdAndUserId("habit-1", "user-1")).thenReturn(0L);

    var updateResult = service.update("user-1", "habit-1", HabitUpdateRequestDto.builder().name("Read more").build());
    var deleteResult = service.delete("user-1", "habit-1");

    assertEquals(404, assertInstanceOf(OperationFailure.class, updateResult).toErrorResponse().status());
    assertEquals(404, assertInstanceOf(OperationFailure.class, deleteResult).toErrorResponse().status());
  }

  private HabitCreateRequestDto createRequest() {
    return HabitCreateRequestDto.builder()
        .id("habit-1")
        .name("Read")
        .color(com.sashplatonov.habbit.runner.model.HabitColor.BLUE)
        .icon("book")
        .frequency(HabitFrequency.DAILY)
        .targetStreak(1)
        .dailyTarget(1)
        .type(HabitType.POSITIVE)
        .build();
  }

  private HabitResponseDto response(String id) {
    return HabitResponseDto.builder()
        .id(id)
        .name("Read")
        .color(com.sashplatonov.habbit.runner.model.HabitColor.BLUE)
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
}
