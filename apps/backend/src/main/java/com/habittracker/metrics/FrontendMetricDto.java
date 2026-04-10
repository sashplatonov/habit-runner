package com.habittracker.metrics;

public record FrontendMetricDto(
    String name,
    Double value,
    String unit,
    String operation,
    Integer status,
    Boolean success
) {
}