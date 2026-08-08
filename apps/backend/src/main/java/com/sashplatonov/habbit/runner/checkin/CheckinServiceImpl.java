package com.sashplatonov.habbit.runner.checkin;

import com.sashplatonov.habbit.runner.api.OperationResult;
import com.sashplatonov.habbit.runner.checkin.dto.CheckinResponseDto;
import com.sashplatonov.habbit.runner.api.CursorPageDto;
import com.sashplatonov.habbit.runner.checkin.dto.CheckinUpsertRequestDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class CheckinServiceImpl implements CheckinService {
  private final CheckinQueryHandler checkinQueryHandler;
  private final CheckinMutationHandler checkinMutationHandler;

  @Inject
  CheckinServiceImpl(
      CheckinQueryHandler checkinQueryHandler,
      CheckinMutationHandler checkinMutationHandler
  ) {
    this.checkinQueryHandler = checkinQueryHandler;
    this.checkinMutationHandler = checkinMutationHandler;
  }

  @Override
  public List<CheckinResponseDto> findAll(String userId) {
    return checkinQueryHandler.findAll(userId);
  }

  @Override
  public CursorPageDto<CheckinResponseDto> findPage(String userId, String cursor, int limit) {
    return checkinQueryHandler.findPage(userId, cursor, limit);
  }

  @Override
  public OperationResult<CheckinResponseDto> upsert(
      String userId,
      String habitId,
      String date,
      CheckinUpsertRequestDto request
  ) {
    return checkinMutationHandler.upsert(userId, habitId, date, request);
  }

  @Override
  public OperationResult<Void> delete(String userId, String habitId, String date) {
    return checkinMutationHandler.delete(userId, habitId, date);
  }
}
