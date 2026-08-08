package com.sashplatonov.habbit.runner.checkin;

import com.sashplatonov.habbit.runner.api.OperationResult;
import com.sashplatonov.habbit.runner.checkin.dto.CheckinResponseDto;
import com.sashplatonov.habbit.runner.checkin.dto.CheckinUpsertRequestDto;
import com.sashplatonov.habbit.runner.checkin.support.CheckinDateSupport;
import com.sashplatonov.habbit.runner.checkin.support.CheckinMutationCoordinator;
import com.sashplatonov.habbit.runner.checkin.support.CheckinResponses;
import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDate;

@ApplicationScoped
public class CheckinMutationHandler {
  private final CheckinRepository checkinRepository;
  private final HabitRepository habitRepository;
  private final CheckinMapper checkinMapper;
  private final CheckinMutationCoordinator checkinMutationCoordinator;

  @Inject
  public CheckinMutationHandler(
      CheckinRepository checkinRepository,
      HabitRepository habitRepository,
      CheckinMapper checkinMapper,
      CheckinMutationCoordinator checkinMutationCoordinator
  ) {
    this.checkinRepository = checkinRepository;
    this.habitRepository = habitRepository;
    this.checkinMapper = checkinMapper;
    this.checkinMutationCoordinator = checkinMutationCoordinator;
  }

  @Transactional
  public OperationResult<CheckinResponseDto> upsert(
      String userId,
      String habitId,
      String date,
      CheckinUpsertRequestDto request
  ) {
    return checkinMutationCoordinator.measureMutation(() -> upsertInternal(userId, habitId, date, request));
  }

  @Transactional
  public OperationResult<Void> delete(String userId, String habitId, String date) {
    return checkinMutationCoordinator.measureMutation(() -> deleteInternal(userId, habitId, date));
  }

  private OperationResult<CheckinResponseDto> upsertInternal(
      String userId,
      String habitId,
      String date,
      CheckinUpsertRequestDto request
  ) {
    var habit = habitRepository.findByIdAndUserId(habitId, userId);
    if (habit == null) {
      return CheckinResponses.notFound("Habit not found", "HABIT_NOT_FOUND");
    }

    var parsedDate = CheckinDateSupport.parseDate(date);
    if (parsedDate == null) {
      return CheckinResponses.invalidDate();
    }

    if (!Boolean.TRUE.equals(request.done())) {
      return deleteCheckin(userId, habitId, parsedDate, habit);
    }

    var existing = checkinRepository.findByHabitDateAndUserId(habitId, parsedDate, userId);
    if (existing != null && request.version() != null && request.version() != existing.getVersion()) {
      return CheckinResponses.conflict();
    }
    var checkin = existing != null ? existing : new CheckinEntity();
    if (existing == null) {
      checkin.setHabitId(habitId);
      checkin.setUserId(userId);
      checkin.setDate(parsedDate);
    }

    return saveCheckin(checkin, request, habit, existing == null);
  }

  private OperationResult<CheckinResponseDto> deleteCheckin(
      String userId,
      String habitId,
      LocalDate date,
      HabitEntity habit
  ) {
    var deleted = checkinRepository.deleteByHabitIdUserIdAndDate(habitId, userId, date);
    if (deleted == 0) {
      return CheckinResponses.notFound("Checkin not found", "CHECKIN_NOT_FOUND");
    }
    checkinMutationCoordinator.recordCheckinDeleted();
    checkinMutationCoordinator.touch(habit);
    return OperationResult.success(null);
  }

  private OperationResult<CheckinResponseDto> saveCheckin(
      CheckinEntity checkin,
      CheckinUpsertRequestDto request,
      HabitEntity habit,
      boolean newCheckin
  ) {
    checkin.setDone(true);
    checkin.setCount(Math.max(1, request.count() != null ? request.count() : 1));
    checkinMutationCoordinator.normalize(checkin);
    if (newCheckin) {
      checkinRepository.save(checkin);
    } else {
      checkinMutationCoordinator.touch(checkin);
    }
    checkinMutationCoordinator.touch(habit);
    checkinMutationCoordinator.recordCheckinUpserted();
    return OperationResult.success(checkinMapper.toResponse(checkin));
  }

  private OperationResult<Void> deleteInternal(String userId, String habitId, String date) {
    var habit = habitRepository.findByIdAndUserId(habitId, userId);
    if (habit == null) {
      return CheckinResponses.notFound("Habit not found", "HABIT_NOT_FOUND");
    }
    var parsedDate = CheckinDateSupport.parseDate(date);
    if (parsedDate == null) {
      return CheckinResponses.invalidDateVoid();
    }
    var deleted = checkinRepository.deleteByHabitIdUserIdAndDate(habitId, userId, parsedDate);
    if (deleted == 0) {
      return CheckinResponses.notFound("Checkin not found", "CHECKIN_NOT_FOUND");
    }
    checkinMutationCoordinator.touch(habit);
    checkinMutationCoordinator.recordCheckinDeleted();
    return OperationResult.success(null);
  }
}
