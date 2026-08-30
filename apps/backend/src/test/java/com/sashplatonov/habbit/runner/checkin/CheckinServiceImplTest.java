package com.sashplatonov.habbit.runner.checkin;

import com.sashplatonov.habbit.runner.api.OperationFailure;
import com.sashplatonov.habbit.runner.api.OperationSuccess;
import com.sashplatonov.habbit.runner.checkin.dto.CheckinUpsertRequestDto;
import com.sashplatonov.habbit.runner.checkin.support.CheckinMutationCoordinator;
import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.mockito.ArgumentMatchers;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CheckinServiceImplTest {
  private final CheckinRepository checkinRepository = mock(CheckinRepository.class);
  private final HabitRepository habitRepository = mock(HabitRepository.class);
  private final CheckinMapper checkinMapper = Mappers.getMapper(CheckinMapper.class);
  private final CheckinMutationCoordinator coordinator = new CheckinMutationCoordinator();
  private final CheckinQueryHandler queryHandler = new CheckinQueryHandler(checkinRepository, checkinMapper);
  private final CheckinMutationHandler mutationHandler = new CheckinMutationHandler(
      checkinRepository,
      habitRepository,
      checkinMapper,
      coordinator
  );
  private final CheckinServiceImpl service = new CheckinServiceImpl(queryHandler, mutationHandler);

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
    assertEquals(3, existing.getCount());
    assertEquals(2, existing.getVersion());
  }

  @Test
  void shouldReturnAllCheckinsForUserWithoutDefaultListLimit() {
    var first = new CheckinEntity();
    first.setId("checkin-1");
    first.setHabitId("habit-1");
    first.setUserId("user-1");
    first.setDate(LocalDate.of(2026, 4, 10));
    first.setDone(true);
    first.setCount(1);
    first.setVersion(1);

    var second = new CheckinEntity();
    second.setId("checkin-2");
    second.setHabitId("habit-1");
    second.setUserId("user-1");
    second.setDate(LocalDate.of(2026, 4, 11));
    second.setDone(true);
    second.setCount(2);
    second.setVersion(1);

    when(checkinRepository.findAllByUserId("user-1")).thenReturn(List.of(first, second));

    var result = service.findAll("user-1");

    assertEquals(2, result.size());
    verify(checkinRepository, times(1)).findAllByUserId("user-1");
    verify(checkinRepository, never()).findListForUser("user-1");
  }

  @Test
  void shouldOnlyExposeNextCursorWhenAnotherRowExists() {
    var first = checkin("checkin-1", LocalDate.of(2026, 4, 10));
    var second = checkin("checkin-2", LocalDate.of(2026, 4, 11));
    when(checkinRepository.findSyncPageForUser("user-1", null, null, 3))
        .thenReturn(List.of(first, second));

    var page = queryHandler.findPage("user-1", null, 2);

    assertEquals(2, page.items().size());
    assertNull(page.nextCursor());
    verify(checkinRepository).findSyncPageForUser("user-1", null, null, 3);
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
    verify(checkinRepository, never())
        .deleteByHabitIdUserIdAndDate(ArgumentMatchers.anyString(), ArgumentMatchers.anyString(), ArgumentMatchers.any());
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

  private CheckinEntity checkin(String id, LocalDate date) {
    var entity = new CheckinEntity();
    entity.setId(id);
    entity.setHabitId("habit-1");
    entity.setUserId("user-1");
    entity.setDate(date);
    entity.setDone(true);
    entity.setCount(1);
    entity.setVersion(1);
    entity.setUpdatedAt(date.atStartOfDay().toInstant(java.time.ZoneOffset.UTC));
    return entity;
  }

}
