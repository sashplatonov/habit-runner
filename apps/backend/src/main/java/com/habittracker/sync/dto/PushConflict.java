package com.habittracker.sync.dto;

import lombok.Builder;

@Builder
public record PushConflict(String opId, String reason, ConflictServerValueDto serverValue) {
}
