package com.habittracker.sync.dto;

import java.util.Map;

public record SyncOpDto(String id, String entity, String type, Map<String, Object> payload, String clientTime) {
}
