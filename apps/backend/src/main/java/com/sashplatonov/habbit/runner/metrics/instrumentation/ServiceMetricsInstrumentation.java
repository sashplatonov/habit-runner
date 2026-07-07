package com.sashplatonov.habbit.runner.metrics.instrumentation;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tag;
import io.micrometer.core.instrument.Timer;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.List;
import java.util.function.Supplier;

@ApplicationScoped
public class ServiceMetricsInstrumentation {

    private final MeterRegistry registry;
    private final Counter habitCreatedCounter;
    private final Counter habitDeletedCounter;
    private final Timer mutationTimer;

    ServiceMetricsInstrumentation(
            MeterRegistry registry,
            @ConfigProperty(name = "quarkus.application.name", defaultValue = "habittracker-api")
            String serviceName,
            @ConfigProperty(name = "APP_VERSION", defaultValue = "1.0.0")
            String serviceVersion,
            @ConfigProperty(name = "DEPLOYMENT_ENV", defaultValue = "production")
            String environment) {
        this.registry = registry;

        List<Tag> commonTags = List.of(
                Tag.of("service.name", serviceName),
                Tag.of("service.version", serviceVersion),
                Tag.of("deployment.environment", environment)
        );

        this.habitCreatedCounter = Counter.builder("habittracker.habits.created")
                .description("Habits created via the service layer")
                .tags(commonTags)
                .register(registry);

        this.habitDeletedCounter = Counter.builder("habittracker.habits.deleted")
                .description("Habits deleted via the service layer")
                .tags(commonTags)
                .register(registry);

        this.mutationTimer = Timer.builder("habittracker.mutations.request.roundtrip")
                .description("Wall-clock duration of a full mutation request in the service layer")
                .tags(commonTags)
                .publishPercentileHistogram()
                .register(registry);
    }

    public void recordHabitCreated() {
        habitCreatedCounter.increment();
    }

    public void recordHabitDeleted() {
        habitDeletedCounter.increment();
    }

    public <T> T measureMutation(Supplier<T> action) {
        var sample = Timer.start(registry);
        try {
            return action.get();
        } finally {
            sample.stop(mutationTimer);
        }
    }

    public void measureMutation(Runnable action) {
        var sample = Timer.start(registry);
        try {
            action.run();
        } finally {
            sample.stop(mutationTimer);
        }
    }
}
