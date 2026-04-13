package com.sashplatonov.habbit.runner.sync.dto;

import lombok.Builder;

@Builder
public record CheckinDto(
    String id,
    String habitId,
    String date,
    boolean done,
    Integer count,
    String updatedAt,
    int version
) {
}
