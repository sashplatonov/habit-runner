package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.sync.dto.PullResponseDto;

final class StubSyncPullProcessor extends SyncPullProcessor {
  private final PullResponseDto response;
  private String userId;
  private String since;

  StubSyncPullProcessor(PullResponseDto response) {
    super(null, null);
    this.response = response;
  }

  String getUserId() {
    return userId;
  }

  String getSince() {
    return since;
  }

  @Override
  public PullResponseDto pull(String userId, String since) {
    this.userId = userId;
    this.since = since;
    return response;
  }
}
