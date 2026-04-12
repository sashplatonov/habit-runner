package com.sashplatonov.habbit.runner.sync.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record PushRequestDto(List<SyncOpDto> ops) {
}
