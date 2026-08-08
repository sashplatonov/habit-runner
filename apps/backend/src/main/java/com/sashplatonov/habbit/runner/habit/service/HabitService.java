package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.api.OperationResult;
import com.sashplatonov.habbit.runner.api.CursorPageDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitCreateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitResponseDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitStatusUpdateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitUpdateRequestDto;

import java.util.List;

public interface HabitService {
  List<HabitResponseDto> findAll(String userId);

  CursorPageDto<HabitResponseDto> findPage(String userId, String cursor, int limit);

  OperationResult<HabitResponseDto> create(String userId, HabitCreateRequestDto request);

  OperationResult<HabitResponseDto> update(String userId, String habitId, HabitUpdateRequestDto request);

  OperationResult<HabitResponseDto> updateStatus(String userId, String habitId, HabitStatusUpdateRequestDto request);

  OperationResult<Void> delete(String userId, String habitId);
}
