package com.habittracker.sync.dto;

import lombok.Builder;

@Builder
public record CheckinPayloadDto(
    String id,
    String habitId,
    String date,
    Boolean done,
    Integer count,
    String updatedAt,
    Integer version
) {
}
