package com.sashplatonov.habbit.runner.checkin;

import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.api.OperationResult;
import com.sashplatonov.habbit.runner.checkin.dto.CheckinResponseDto;
import com.sashplatonov.habbit.runner.checkin.dto.CheckinUpsertRequestDto;
import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@ApplicationScoped
@Slf4j
public class CheckinServiceImpl implements CheckinService {
  private final CheckinRepository checkinRepository;
  private final HabitRepository habitRepository;
  private final CheckinMapper checkinMapper;

  public CheckinServiceImpl(
      CheckinRepository checkinRepository,
      HabitRepository habitRepository,
      CheckinMapper checkinMapper
  ) {
    this.checkinRepository = checkinRepository;
    this.habitRepository = habitRepository;
    this.checkinMapper = checkinMapper;
  }

  @Override
  public List<CheckinResponseDto> findAll(String userId) {
    return checkinRepository.findAllByUserId(userId).stream()
        .map(checkinMapper::toResponse)
        .toList();
  }

  @Override
  @Transactional
  public OperationResult<CheckinResponseDto> upsert(
      String userId,
      String habitId,
      String date,
      CheckinUpsertRequestDto request
  ) {
    var habit = habitRepository.findByIdAndUserId(habitId, userId);
    if (habit == null) {
      return notFound("Habit not found", "HABIT_NOT_FOUND");
    }

    var parsedDate = parseDate(date);
    if (parsedDate == null) {
      return invalidDate();
    }

    if (!Boolean.TRUE.equals(request.done())) {
      var deleted = checkinRepository.deleteByHabitIdUserIdAndDate(habitId, userId, parsedDate);
      if (deleted == 0) {
        return notFound("Checkin not found", "CHECKIN_NOT_FOUND");
      }
      return OperationResult.success(null);
    }

    var existing = checkinRepository.findByHabitDateAndUserId(habitId, parsedDate, userId);
    var checkin = existing != null ? existing : new CheckinEntity();
    if (existing == null) {
      checkin.setHabitId(habitId);
      checkin.setUserId(userId);
      checkin.setDate(parsedDate);
      checkin.setCreatedAt(Instant.now());
      checkin.setVersion(1);
    }
    checkin.setDone(true);
    checkin.setCount(Math.max(1, request.count() != null ? request.count() : 1));
    checkin.setUpdatedAt(Instant.now());
    checkin.setVersion(existing == null ? 1 : Math.max(1, existing.getVersion()) + 1);
    if (existing == null) {
      checkinRepository.save(checkin);
    }
    touchHabit(habit);
    return OperationResult.success(checkinMapper.toResponse(checkin));
  }

  @Override
  @Transactional
  public OperationResult<Void> delete(String userId, String habitId, String date) {
    var habit = habitRepository.findByIdAndUserId(habitId, userId);
    if (habit == null) {
      return notFound("Habit not found", "HABIT_NOT_FOUND");
    }
    var parsedDate = parseDate(date);
    if (parsedDate == null) {
      return invalidDateVoid();
    }
    var deleted = checkinRepository.deleteByHabitIdUserIdAndDate(habitId, userId, parsedDate);
    if (deleted == 0) {
      return notFound("Checkin not found", "CHECKIN_NOT_FOUND");
    }
    touchHabit(habit);
    return OperationResult.success(null);
  }

  private void touchHabit(com.sashplatonov.habbit.runner.model.HabitEntity habit) {
    habit.setUpdatedAt(Instant.now());
    habit.setVersion(Math.max(1, habit.getVersion()) + 1);
  }

  private LocalDate parseDate(String value) {
    try {
      return LocalDate.parse(value);
    } catch (DateTimeParseException exception) {
      return null;
    }
  }

  private OperationResult<CheckinResponseDto> invalidDate() {
    return OperationResult.failure(new ErrorResponse(
        "https://habbit-runner.dev/errors/checkin-invalid-date",
        "Bad Request",
        400,
        "Invalid checkin date",
        "CHECKIN_INVALID_DATE"
    ));
  }

  private OperationResult<Void> invalidDateVoid() {
    return OperationResult.failure(new ErrorResponse(
        "https://habbit-runner.dev/errors/checkin-invalid-date",
        "Bad Request",
        400,
        "Invalid checkin date",
        "CHECKIN_INVALID_DATE"
    ));
  }

  private <T> OperationResult<T> notFound(String detail, String code) {
    return OperationResult.failure(new ErrorResponse(
        "https://habbit-runner.dev/errors/" + code.toLowerCase().replace('_', '-'),
        "Not Found",
        404,
        detail,
        code
    ));
  }
}
