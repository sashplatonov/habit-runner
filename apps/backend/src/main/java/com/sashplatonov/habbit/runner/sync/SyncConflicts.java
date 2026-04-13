package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.sync.dto.ConflictServerValueDto;
import com.sashplatonov.habbit.runner.sync.dto.PushConflict;

import java.time.Instant;

final class SyncConflicts {
  private SyncConflicts() {
  }

  static PushConflict newerServerValue(
      SyncPayloadCodec payloadCodec,
      String opId,
      String message,
      ServerState serverState
  ) {
    return PushConflict.builder()
        .opId(opId)
        .reason(message)
        .serverValue(ConflictServerValueDto.builder()
        .version(serverState.version())
        .updatedAt(payloadCodec.toSyncIso(serverState.updatedAt()))
            .build())
        .build();
  }

  static PushConflict missingEntity(String opId, String message) {
    return PushConflict.builder()
        .opId(opId)
        .reason(message)
        .serverValue(null)
        .build();
  }

  static ServerState serverState(int version, Instant updatedAt) {
    return new ServerState(version, updatedAt);
  }

  record ServerState(int version, Instant updatedAt) {
  }
}
