package com.habittracker.sync.dto;

public record HabitDto(
    String id,
    String name,
    String description,
    String color,
    String icon,
    String frequency,
    Object customDays,
    Object schedule,
    int targetStreak,
    int dailyTarget,
    Object tags,
    boolean archived,
    String createdAt,
    String updatedAt,
    int version,
    int sortOrder,
    String reminderTime,
    Boolean reminderEnabled,
    String type,
    Object freezeDays
) {
}
