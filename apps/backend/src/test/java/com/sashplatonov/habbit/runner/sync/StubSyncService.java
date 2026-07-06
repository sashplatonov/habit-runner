package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.sync.dto.PullResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.PushResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;

import java.util.List;

final class StubSyncService implements SyncService {
  private String lastPullUserId;
  private String lastPullSince;
  private String lastPushUserId;
  private List<SyncOpDto> lastPushOps = List.of();
  private PullResponseDto pullResponse;
  private PushResponseDto pushResponse;

  public void setPullResponse(PullResponseDto pullResponse) {
    this.pullResponse = pullResponse;
  }

  public void setPushResponse(PushResponseDto pushResponse) {
    this.pushResponse = pushResponse;
  }

  public PullResponseDto getPullResponse() {
    return pullResponse;
  }

  public PushResponseDto getPushResponse() {
    return pushResponse;
  }

  public String getLastPullUserId() {
    return lastPullUserId;
  }

  public String getLastPullSince() {
    return lastPullSince;
  }

  public String getLastPushUserId() {
    return lastPushUserId;
  }

  public List<SyncOpDto> getLastPushOps() {
    return lastPushOps;
  }

  @Override
  public PullResponseDto pull(String userId, String since) {
    lastPullUserId = userId;
    lastPullSince = since;
    return pullResponse;
  }

  @Override
  public PushResponseDto push(String userId, List<SyncOpDto> ops) {
    lastPushUserId = userId;
    lastPushOps = ops;
    return pushResponse;
  }
}
