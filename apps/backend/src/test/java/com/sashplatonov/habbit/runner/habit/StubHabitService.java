package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.api.OperationResult;
import com.sashplatonov.habbit.runner.api.CursorPageDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitCreateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitResponseDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitStatusUpdateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitUpdateRequestDto;

import java.util.List;

final class StubHabitService implements HabitService {
  private String lastUserId;
  private String lastHabitId;
  private HabitCreateRequestDto lastCreateRequest;
  private HabitUpdateRequestDto lastUpdateRequest;
  private HabitStatusUpdateRequestDto lastStatusRequest;
  private OperationResult<HabitResponseDto> response;
  private OperationResult<Void> deleteResponse;
  private List<HabitResponseDto> listResponse = List.of();

  public void setResponse(OperationResult<HabitResponseDto> response) {
    this.response = response;
  }

  public void setDeleteResponse(OperationResult<Void> deleteResponse) {
    this.deleteResponse = deleteResponse;
  }

  public String getLastUserId() {
    return lastUserId;
  }

  public String getLastHabitId() {
    return lastHabitId;
  }

  public HabitCreateRequestDto getLastCreateRequest() {
    return lastCreateRequest;
  }

  public HabitUpdateRequestDto getLastUpdateRequest() {
    return lastUpdateRequest;
  }

  public HabitStatusUpdateRequestDto getLastStatusRequest() {
    return lastStatusRequest;
  }

  @Override
  public List<HabitResponseDto> findAll(String userId) {
    lastUserId = userId;
    return listResponse;
  }

  @Override
  public CursorPageDto<HabitResponseDto> findPage(String userId, String cursor, int limit) {
    lastUserId = userId;
    return new CursorPageDto<>(listResponse, null);
  }

  public void setListResponse(List<HabitResponseDto> listResponse) {
    this.listResponse = listResponse;
  }

  @Override
  public OperationResult<HabitResponseDto> create(String userId, HabitCreateRequestDto request) {
    lastUserId = userId;
    lastCreateRequest = request;
    return response;
  }

  @Override
  public OperationResult<HabitResponseDto> update(String userId, String habitId, HabitUpdateRequestDto request) {
    lastUserId = userId;
    lastHabitId = habitId;
    lastUpdateRequest = request;
    return response;
  }

  @Override
  public OperationResult<HabitResponseDto> updateStatus(String userId, String habitId, HabitStatusUpdateRequestDto request) {
    lastUserId = userId;
    lastHabitId = habitId;
    lastStatusRequest = request;
    return response;
  }

  @Override
  public OperationResult<Void> delete(String userId, String habitId) {
    lastUserId = userId;
    lastHabitId = habitId;
    return deleteResponse;
  }
}
