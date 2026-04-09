package com.habittracker.sync.dto;

import java.util.List;

public record PullResponseDto(
    List<HabitDto> habits,
    List<CheckinDto> checkins,
    List<TombstoneDto> tombstones,
    String nextCursor,
    String serverTime
) {
}
