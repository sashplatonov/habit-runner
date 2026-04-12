package com.sashplatonov.habbit.runner.sync.dto;

import lombok.Builder;

@Builder
public record ConflictServerValueDto(
    int version,
    String updatedAt
) {
}
