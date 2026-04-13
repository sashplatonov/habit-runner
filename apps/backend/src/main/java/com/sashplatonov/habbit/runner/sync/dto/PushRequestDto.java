package com.sashplatonov.habbit.runner.sync.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.List;

@Builder
public record PushRequestDto(@NotNull @Size(max = 500) List<@Valid @NotNull SyncOpDto> ops) {
}
