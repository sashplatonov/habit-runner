package com.habittracker.sync.dto;

import com.habittracker.sync.SyncOperationType;
import lombok.Builder;

@Builder
public record SyncOpDto(String id, String entity, SyncOperationType type, SyncOpPayloadDto payload, String clientTime) {
}
