package com.sashplatonov.habbit.runner.checkin.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Builder;

@Builder
public record CheckinUpsertRequestDto(
    @NotNull Boolean done,
    @Positive Integer count,
    Integer version
) {
}
