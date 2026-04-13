package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.sync.dto.PullResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.PushResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;

import java.util.List;

public interface SyncService {
  PullResponseDto pull(String userId, String since);

  PushResponseDto push(String userId, List<SyncOpDto> ops);
}
