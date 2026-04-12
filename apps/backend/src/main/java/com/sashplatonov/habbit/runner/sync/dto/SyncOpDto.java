package com.sashplatonov.habbit.runner.sync.dto;

import com.sashplatonov.habbit.runner.sync.SyncOperationType;
import lombok.Builder;

@Builder
public record SyncOpDto(String id, String entity, SyncOperationType type, SyncOpPayloadDto payload, String clientTime) {
}
