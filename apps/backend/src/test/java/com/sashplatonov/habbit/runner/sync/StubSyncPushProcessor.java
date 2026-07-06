package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.sync.dto.PushResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;

import java.util.List;

final class StubSyncPushProcessor extends SyncPushProcessor {
  private final PushResponseDto response;
  private String userId;
  private List<SyncOpDto> ops;

  StubSyncPushProcessor(PushResponseDto response) {
    super(null, null, null);
    this.response = response;
  }

  String getUserId() {
    return userId;
  }

  List<SyncOpDto> getOps() {
    return ops;
  }

  @Override
  public PushResponseDto push(String userId, List<SyncOpDto> ops) {
    this.userId = userId;
    this.ops = ops;
    return response;
  }
}
