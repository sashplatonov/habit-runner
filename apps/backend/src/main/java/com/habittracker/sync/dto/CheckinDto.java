package com.habittracker.sync.dto;

public record CheckinDto(
    String id,
    String habitId,
    String date,
    boolean done,
    Integer count,
    String updatedAt,
    int version
) {
}
