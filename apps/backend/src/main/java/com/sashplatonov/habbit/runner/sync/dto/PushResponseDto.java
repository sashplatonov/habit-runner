package com.sashplatonov.habbit.runner.sync.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record PushResponseDto(
    List<String> applied,
    List<PushConflict> conflicts,
    List<HabitDto> habits,
    List<CheckinDto> checkins,
    List<TombstoneDto> tombstones,
    String nextCursor,
    String serverTime
) {
}
