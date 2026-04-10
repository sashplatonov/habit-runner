package com.habittracker.sync.dto;

import lombok.Builder;

@Builder
public record TombstoneDto(
    String id,
    String entity,
    String entityId,
    String deletedAt,
    int version
) {
}
