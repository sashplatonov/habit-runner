package com.sashplatonov.habbit.runner.sync.dto;

import com.sashplatonov.habbit.runner.sync.SyncOperationType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record SyncOpDto(
	@NotBlank String id,
	@NotBlank String entity,
	@NotNull SyncOperationType type,
	@Valid @NotNull SyncOpPayloadDto payload,
	String clientTime
) {
}
