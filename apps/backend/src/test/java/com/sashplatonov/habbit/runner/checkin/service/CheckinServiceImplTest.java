package com.sashplatonov.habbit.runner.checkin.service;

import com.sashplatonov.habbit.runner.api.OperationFailure;
import com.sashplatonov.habbit.runner.api.OperationSuccess;
import com.sashplatonov.habbit.runner.checkin.CheckinMapper;
import com.sashplatonov.habbit.runner.checkin.CheckinServiceImpl;
import com.sashplatonov.habbit.runner.checkin.dto.CheckinResponseDto;
import com.sashplatonov.habbit.runner.checkin.dto.CheckinUpsertRequestDto;
import com.sashplatonov.habbit.runner.checkin.support.CheckinMutationCoordinator;
import com.sashplatonov.habbit.runner.habit.dto.HabitResponseDto;
import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CheckinServiceImplTest {
  private final CheckinRepository checkinRepository = mock(CheckinRepository.class);
  private final HabitRepository habitRepository = mock(HabitRepository.class);
  private final CheckinMapper checkinMapper = mock(CheckinMapper.class);
  private final CheckinMutationCoordinator coordinator = new CheckinMutationCoordinator();
  private final CheckinServiceImpl service = new CheckinServiceImpl(checkinRepository, habitRepository, checkinMapper, coordinator);

  @BeforeEach
  void setUp() {
    doAnswer(invocation -> response("checkin-1")).when(checkinMapper).toResponse(ArgumentMatchers.any());
  }

  @Test
  void shouldUpsertCheckinAndDeleteWhenMarkedFalse() {
    var habit = habit();
    when(habitRepository.findByIdAndUserId("habit-1", "user-1")).thenReturn(habit);
    when(checkinRepository.findByHabitDateAndUserId("habit-1", LocalDate.of(2026, 4, 10), "user-1"))
        .thenReturn(null);
    when(checkinRepository.deleteByHabitIdUserIdAndDate("habit-1", "user-1", LocalDate.of(2026, 4, 11)))
        .thenReturn(1L);

    var upsertResult = service.upsert(
        "user-1",
        "habit-1",
        "2026-04-10",
        CheckinUpsertRequestDto.builder().done(true).count(2).build()
    );
    var deleteResult = service.upsert(
        "user-1",
        "habit-1",
        "2026-04-11",
        CheckinUpsertRequestDto.builder().done(false).build()
    );

    assertInstanceOf(OperationSuccess.class, upsertResult);
    assertInstanceOf(OperationSuccess.class, deleteResult);
    verify(checkinRepository).save(ArgumentMatchers.any(CheckinEntity.class));
    verify(checkinRepository).deleteByHabitIdUserIdAndDate("habit-1", "user-1", LocalDate.of(2026, 4, 11));
  }

  @Test
  void shouldUpdateExistingCheckinWithoutPersistingASecondRow() {
    var habit = habit();
    var existing = new CheckinEntity();
    existing.setId("checkin-1");
    existing.setHabitId("habit-1");
    existing.setUserId("user-1");
    existing.setDate(LocalDate.of(2026, 4, 10));
    existing.setDone(false);
    existing.setCount(0);
    existing.setVersion(0);

    when(habitRepository.findByIdAndUserId("habit-1", "user-1")).thenReturn(habit);
    when(checkinRepository.findByHabitDateAndUserId("habit-1", LocalDate.of(2026, 4, 10), "user-1"))
        .thenReturn(existing);

    var result = service.upsert(
        "user-1",
        "habit-1",
        "2026-04-10",
        CheckinUpsertRequestDto.builder().done(true).count(3).build()
    );

    assertInstanceOf(OperationSuccess.class, result);
    verify(checkinRepository, never()).save(ArgumentMatchers.any(CheckinEntity.class));
    assertEquals(true, existing.getDone());
    assertEquals(1, existing.getCount());
    assertEquals(2, existing.getVersion());
  }

  @Test
  void shouldRejectInvalidDateWhenHabitExists() {
    when(habitRepository.findByIdAndUserId("habit-1", "user-1")).thenReturn(habit());

    var invalidDate = service.upsert("user-1", "habit-1", "not-a-date", CheckinUpsertRequestDto.builder().done(true).count(1).build());

    assertEquals(400, assertInstanceOf(OperationFailure.class, invalidDate).toErrorResponse().status());
  }

  @Test
  void shouldRejectMissingHabitOnUpsert() {
    when(habitRepository.findByIdAndUserId("habit-1", "user-1")).thenReturn(null);

    var missingHabit = service.upsert("user-1", "habit-1", "2026-04-10", CheckinUpsertRequestDto.builder().done(true).count(1).build());

    assertEquals(404, assertInstanceOf(OperationFailure.class, missingHabit).toErrorResponse().status());
  }

  @Test
  void shouldDeleteExistingCheckinAndReturnNotFoundOtherwise() {
    var habit = habit();
    when(habitRepository.findByIdAndUserId("habit-1", "user-1")).thenReturn(habit);
    when(checkinRepository.deleteByHabitIdUserIdAndDate("habit-1", "user-1", LocalDate.of(2026, 4, 10)))
        .thenReturn(1L);
    when(checkinRepository.deleteByHabitIdUserIdAndDate("habit-1", "user-1", LocalDate.of(2026, 4, 11)))
        .thenReturn(0L);

    var deleteSuccess = service.delete("user-1", "habit-1", "2026-04-10");
    var deleteMissing = service.delete("user-1", "habit-1", "2026-04-11");

    assertInstanceOf(OperationSuccess.class, deleteSuccess);
    assertEquals(404, assertInstanceOf(OperationFailure.class, deleteMissing).toErrorResponse().status());
  }

  @Test
  void shouldReturnNotFoundWhenHabitIsMissingForDelete() {
    when(habitRepository.findByIdAndUserId("habit-1", "user-1")).thenReturn(null);

    var deleteResult = service.delete("user-1", "habit-1", "2026-04-10");

    assertEquals(404, assertInstanceOf(OperationFailure.class, deleteResult).toErrorResponse().status());
    verify(checkinRepository, never()).deleteByHabitIdUserIdAndDate(ArgumentMatchers.anyString(), ArgumentMatchers.anyString(), ArgumentMatchers.any());
  }

  private HabitEntity habit() {
    var entity = new HabitEntity();
    entity.setId("habit-1");
    entity.setUserId("user-1");
    entity.setName("Read");
    entity.setColor(HabitColor.BLUE);
    entity.setIcon("book");
    entity.setFrequency(HabitFrequency.DAILY);
    entity.setTargetStreak(1);
    entity.setDailyTarget(1);
    entity.setTags(List.of());
    entity.setCreatedAt(Instant.parse("2026-04-10T10:00:00Z"));
    entity.setUpdatedAt(Instant.parse("2026-04-10T10:00:00Z"));
    entity.setSortOrder(BigInteger.ONE);
    entity.setType(HabitType.POSITIVE);
    return entity;
  }

  private CheckinResponseDto response(String id) {
    return CheckinResponseDto.builder()
        .id(id)
        .habitId("habit-1")
        .date("2026-04-10")
        .done(true)
        .count(1)
        .createdAt("2026-04-10T10:00:00Z")
        .updatedAt("2026-04-10T10:00:00Z")
        .version(1)
        .build();
  }
}
