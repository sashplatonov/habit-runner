package com.habittracker.sync.dto;

import java.util.List;

public record PushRequestDto(List<SyncOpDto> ops) {
}
