package com.habittracker.sync.dto;

public record TombstoneDto(
    String id,
    String entity,
    String entityId,
    String deletedAt,
    int version
) {
}
