package com.sashplatonov.habbit.runner.checkin.dto;

import lombok.Builder;

@Builder
public record CheckinResponseDto(
    String id,
    String habitId,
    String date,
    boolean done,
    int count,
    String createdAt,
    String updatedAt,
    int version
) {
}
