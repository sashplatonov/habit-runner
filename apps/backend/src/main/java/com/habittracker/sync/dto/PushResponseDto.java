package com.habittracker.sync.dto;

import java.util.List;

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
