package com.sashplatonov.habbit.runner.habit.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record HabitStatusUpdateRequestDto(
    @NotNull Boolean archived
) {
}
