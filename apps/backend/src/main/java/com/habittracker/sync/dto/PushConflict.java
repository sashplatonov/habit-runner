package com.habittracker.sync.dto;

import java.util.Map;

public record PushConflict(String opId, String reason, Map<String, Object> serverValue) {
}
