package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.api.ErrorResponse;
import com.sashplatonov.habbit.runner.api.OperationResult;
import com.sashplatonov.habbit.runner.habit.dto.HabitCreateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitResponseDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitStatusUpdateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitUpdateRequestDto;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.habit.support.HabitMutationSupport;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetric;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetricsInstrumentation;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@ApplicationScoped
@Slf4j
public class HabitServiceImpl implements HabitService {
  private final HabitRepository habitRepository;
  private final CheckinRepository checkinRepository;
  private final HabitMapper habitMapper;
  private final ServiceMetricsInstrumentation serviceMetricsInstrumentation;

  public HabitServiceImpl(
      HabitRepository habitRepository,
      CheckinRepository checkinRepository,
      HabitMapper habitMapper,
      ServiceMetricsInstrumentation serviceMetricsInstrumentation
  ) {
    this.habitRepository = habitRepository;
    this.checkinRepository = checkinRepository;
    this.habitMapper = habitMapper;
    this.serviceMetricsInstrumentation = serviceMetricsInstrumentation;
  }

  @Override
  public List<HabitResponseDto> findAll(String userId) {
    return habitRepository.findListForUser(userId).stream()
        .map(habitMapper::toResponse)
        .toList();
  }

  @Override
  @Transactional
  public OperationResult<HabitResponseDto> create(String userId, HabitCreateRequestDto request) {
    return serviceMetricsInstrumentation.measureMutation(() -> {
      log.debug("Creating habit userId={} habitId={}", userId, request.id());
      var existing = habitRepository.findHabitById(request.id());
      if (existing != null) {
        return OperationResult.failure(new ErrorResponse(
            "https://habbit-runner.dev/errors/habit-conflict",
            "Conflict",
            409,
            "Habit id already exists",
            "HABIT_CONFLICT"
        ));
      }

      var habit = new HabitEntity();
      habitMapper.applyCreate(request, habit);
      habit.setId(request.id());
      habit.setUserId(userId);
      HabitMutationSupport.normalize(habit);
      HabitMutationSupport.touch(habit);
      habitRepository.save(habit);
      serviceMetricsInstrumentation.record(ServiceMetric.HABIT_CREATED);
      return OperationResult.success(habitMapper.toResponse(habit));
    });
  }

  @Override
  @Transactional
  public OperationResult<HabitResponseDto> update(String userId, String habitId, HabitUpdateRequestDto request) {
    return serviceMetricsInstrumentation.measureMutation(() -> {
      log.debug("Updating habit userId={} habitId={}", userId, habitId);
      var habit = habitRepository.findByIdAndUserId(habitId, userId);
      if (habit == null) {
        return notFound();
      }
      if (request.version() != null && request.version() != habit.getVersion()) {
        return versionConflict();
      }

      habitMapper.applyUpdate(request, habit);
      HabitMutationSupport.normalize(habit);
      HabitMutationSupport.touch(habit);
      if (serviceMetricsInstrumentation != null) {
        serviceMetricsInstrumentation.record(ServiceMetric.HABIT_UPDATED);
      }
      return OperationResult.success(habitMapper.toResponse(habit));
    });
  }

  @Override
  @Transactional
  public OperationResult<HabitResponseDto> updateStatus(
      String userId,
      String habitId,
      HabitStatusUpdateRequestDto request
  ) {
    return serviceMetricsInstrumentation.measureMutation(() -> {
      log.debug("Updating habit status userId={} habitId={} archived={}", userId, habitId, request.archived());
      var habit = habitRepository.findByIdAndUserId(habitId, userId);
      if (habit == null) {
        return notFound();
      }
      if (request.version() != null && request.version() != habit.getVersion()) {
        return versionConflict();
      }

      habit.setArchived(Boolean.TRUE.equals(request.archived()));
      HabitMutationSupport.touch(habit);
      return OperationResult.success(habitMapper.toResponse(habit));
    });
  }

  @Override
  @Transactional
  public OperationResult<Void> delete(String userId, String habitId) {
    return serviceMetricsInstrumentation.measureMutation(() -> {
      log.debug("Deleting habit userId={} habitId={}", userId, habitId);
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
      if (serviceMetricsInstrumentation != null) {
        serviceMetricsInstrumentation.record(ServiceMetric.HABIT_DELETED);
      }
      return OperationResult.success(null);
    });
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

  private OperationResult<HabitResponseDto> versionConflict() {
    return OperationResult.failure(new ErrorResponse(
        "https://habbit-runner.dev/errors/conflict",
        "Conflict",
        409,
        "The resource was changed by another request",
        "RESOURCE_VERSION_CONFLICT"
    ));
  }
}
