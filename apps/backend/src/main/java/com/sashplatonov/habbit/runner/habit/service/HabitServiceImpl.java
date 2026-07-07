package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.api.OperationResult;
import com.sashplatonov.habbit.runner.habit.dto.HabitCreateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitResponseDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitStatusUpdateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitUpdateRequestDto;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.math.BigInteger;
import java.time.Instant;
import java.util.List;

@ApplicationScoped
@Slf4j
public class HabitServiceImpl implements HabitService {
  private final HabitRepository habitRepository;
  private final CheckinRepository checkinRepository;
  private final HabitMapper habitMapper;

  public HabitServiceImpl(
      HabitRepository habitRepository,
      CheckinRepository checkinRepository,
      HabitMapper habitMapper
  ) {
    this.habitRepository = habitRepository;
    this.checkinRepository = checkinRepository;
    this.habitMapper = habitMapper;
  }

  @Override
  public List<HabitResponseDto> findAll(String userId) {
    return habitRepository.findAllByUserId(userId).stream()
        .map(habitMapper::toResponse)
        .toList();
  }

  @Override
  @Transactional
  public OperationResult<HabitResponseDto> create(String userId, HabitCreateRequestDto request) {
    log.info("Creating habit userId={} habitId={}", userId, request.id());
    var existing = habitRepository.findHabitById(request.id());
    if (existing != null && !userId.equals(existing.getUserId())) {
      return OperationResult.failure(new ErrorResponse(
          "https://habbit-runner.dev/errors/habit-conflict",
          "Conflict",
          409,
          "Habit id already belongs to another user",
          "HABIT_CONFLICT"
      ));
    }

    var habit = existing != null ? existing : new HabitEntity();
    habitMapper.applyCreate(request, habit);
    habit.setId(request.id());
    habit.setUserId(userId);
    if (existing == null) {
      applyCreateDefaults(habit, true);
      habitRepository.save(habit);
    } else {
      applyCreateDefaults(habit, false);
    }
    return OperationResult.success(habitMapper.toResponse(habit));
  }

  @Override
  @Transactional
  public OperationResult<HabitResponseDto> update(String userId, String habitId, HabitUpdateRequestDto request) {
    log.info("Updating habit userId={} habitId={}", userId, habitId);
    var habit = habitRepository.findByIdAndUserId(habitId, userId);
    if (habit == null) {
      return notFound();
    }

    habitMapper.applyUpdate(request, habit);
    applyUpdatedDefaults(habit);
    return OperationResult.success(habitMapper.toResponse(habit));
  }

  @Override
  @Transactional
  public OperationResult<HabitResponseDto> updateStatus(
      String userId,
      String habitId,
      HabitStatusUpdateRequestDto request
  ) {
    log.info("Updating habit status userId={} habitId={} archived={}", userId, habitId, request.archived());
    var habit = habitRepository.findByIdAndUserId(habitId, userId);
    if (habit == null) {
      return notFound();
    }

    habit.setArchived(Boolean.TRUE.equals(request.archived()));
    touch(habit);
    return OperationResult.success(habitMapper.toResponse(habit));
  }

  @Override
  @Transactional
  public OperationResult<Void> delete(String userId, String habitId) {
    log.info("Deleting habit userId={} habitId={}", userId, habitId);
    checkinRepository.deleteByHabitIdAndUserId(habitId, userId);
    var deleted = habitRepository.deleteByIdAndUserId(habitId, userId);
    if (deleted == 0) {
      return OperationResult.failure(new ErrorResponse(
          "https://habbit-runner.dev/errors/habit-not-found",
          "Not Found",
          404,
          "Habit not found",
          "HABIT_NOT_FOUND"
      ));
    }
    return OperationResult.success(null);
  }

  private OperationResult<HabitResponseDto> notFound() {
    return OperationResult.failure(new ErrorResponse(
        "https://habbit-runner.dev/errors/habit-not-found",
        "Not Found",
        404,
        "Habit not found",
        "HABIT_NOT_FOUND"
    ));
  }

  private void applyCreateDefaults(HabitEntity habit, boolean newHabit) {
    if (newHabit && habit.getCreatedAt() == null) {
      habit.setCreatedAt(Instant.now());
    }
    if (habit.getColor() == null) {
      habit.setColor(HabitColor.BLUE);
    }
    if (habit.getIcon() == null) {
      habit.setIcon("star");
    }
    if (habit.getFrequency() == null) {
      habit.setFrequency(HabitFrequency.DAILY);
    }
    if (habit.getTargetStreak() < 1) {
      habit.setTargetStreak(1);
    }
    if (habit.getDailyTarget() < 1) {
      habit.setDailyTarget(1);
    }
    if (habit.getSortOrder() == null) {
      habit.setSortOrder(BigInteger.ZERO);
    }
    if (habit.getType() == null) {
      habit.setType(HabitType.POSITIVE);
    }
    if (habit.getTags() == null) {
      habit.setTags(List.of());
    }
    if (habit.getFreezeDays() == null) {
      habit.setFreezeDays(List.of());
    }
    touch(habit);
    if (newHabit && habit.getVersion() < 1) {
      habit.setVersion(1);
    }
  }

  private void applyUpdatedDefaults(HabitEntity habit) {
    if (habit.getColor() == null) {
      habit.setColor(HabitColor.BLUE);
    }
    if (habit.getIcon() == null) {
      habit.setIcon("star");
    }
    if (habit.getFrequency() == null) {
      habit.setFrequency(HabitFrequency.DAILY);
    }
    if (habit.getTargetStreak() < 1) {
      habit.setTargetStreak(1);
    }
    if (habit.getDailyTarget() < 1) {
      habit.setDailyTarget(1);
    }
    if (habit.getSortOrder() == null) {
      habit.setSortOrder(BigInteger.ZERO);
    }
    if (habit.getType() == null) {
      habit.setType(HabitType.POSITIVE);
    }
    if (habit.getTags() == null) {
      habit.setTags(List.of());
    }
    if (habit.getFreezeDays() == null) {
      habit.setFreezeDays(List.of());
    }
    touch(habit);
  }

  private void touch(HabitEntity habit) {
    habit.setUpdatedAt(Instant.now());
    habit.setVersion(Math.max(1, habit.getVersion()) + 1);
  }
}
