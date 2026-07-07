package com.sashplatonov.habbit.runner.checkin;

import com.sashplatonov.habbit.runner.api.OperationResult;
import com.sashplatonov.habbit.runner.checkin.dto.CheckinResponseDto;
import com.sashplatonov.habbit.runner.checkin.dto.CheckinUpsertRequestDto;

import java.util.List;

public interface CheckinService {
  List<CheckinResponseDto> findAll(String userId);

  OperationResult<CheckinResponseDto> upsert(String userId, String habitId, String date, CheckinUpsertRequestDto request);

  OperationResult<Void> delete(String userId, String habitId, String date);
}
