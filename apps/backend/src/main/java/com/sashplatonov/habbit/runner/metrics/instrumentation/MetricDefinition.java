package com.sashplatonov.habbit.runner.metrics.instrumentation;

public record MetricDefinition(
    String metricName,
    String description,
    String operation,
    String outcome,
    String provider
) {
}
