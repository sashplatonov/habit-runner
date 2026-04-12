package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.sync.dto.PullResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.PushResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class SyncService {
  private final SyncPullProcessor syncPullProcessor;
  private final SyncPushProcessor syncPushProcessor;

  public SyncService(SyncPullProcessor syncPullProcessor, SyncPushProcessor syncPushProcessor) {
    this.syncPullProcessor = syncPullProcessor;
    this.syncPushProcessor = syncPushProcessor;
  }

  public PullResponseDto pull(String userId, String since) {
    return syncPullProcessor.pull(userId, since);
  }

  public PushResponseDto push(String userId, List<SyncOpDto> ops) {
    return syncPushProcessor.push(userId, ops);
  }
}
