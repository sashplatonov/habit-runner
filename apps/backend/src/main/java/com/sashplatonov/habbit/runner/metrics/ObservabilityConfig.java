package com.sashplatonov.habbit.runner.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tag;
import io.micrometer.core.instrument.Timer;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.List;

/**
 * Registers common resource tags on the MeterRegistry at startup and exposes
 * example business-level counters / timers for injection throughout the app.
 *
 * <p>Resource tags (service.name, service.version, deployment.environment) are
 * attached here so every exported metric carries the same service identity.
 */
@ApplicationScoped
public class ObservabilityConfig {

    private final MeterRegistry registry;
    private final String serviceName;
    private final String serviceVersion;
    private final String environment;

    // ── Example business metrics ────────────────────────────────────────────
    // Inject these via constructor into service classes that need them.
    // They are registered once here so the common tag set is applied consistently.
    private final Counter habitCreatedCounter;
    private final Counter habitDeletedCounter;
    private final Timer habitSyncRoundtripTimer;

    ObservabilityConfig(
            MeterRegistry registry,
            @ConfigProperty(name = "quarkus.application.name", defaultValue = "habittracker-api")
            String serviceName,
            @ConfigProperty(name = "APP_VERSION", defaultValue = "1.0.0")
            String serviceVersion,
            @ConfigProperty(name = "DEPLOYMENT_ENV", defaultValue = "production")
            String environment) {

        this.registry = registry;
        this.serviceName = serviceName;
        this.serviceVersion = serviceVersion;
        this.environment = environment;

        List<Tag> commonTags = List.of(
                Tag.of("service.name", serviceName),
                Tag.of("service.version", serviceVersion),
                Tag.of("deployment.environment", environment)
        );

        this.habitCreatedCounter = Counter.builder("habittracker.habits.created")
                .description("Habits created via the REST API")
                .tags(commonTags)
                .register(registry);

        this.habitDeletedCounter = Counter.builder("habittracker.habits.deleted")
                .description("Habits deleted via the REST API")
                .tags(commonTags)
                .register(registry);

        this.habitSyncRoundtripTimer = Timer.builder("habittracker.habits.request.roundtrip")
                .description("Wall-clock duration of a full client habit mutation request")
                .tags(commonTags)
                .publishPercentileHistogram()
                .register(registry);
    }

    /**
     * Startup hook kept for future use (e.g. registering gauges for live objects).
     * We avoid mutating global common tags after Micrometer meters are already
     * registered because that can break tag-key compatibility across meters with
     * the same name.
     */
    void onStart(@Observes StartupEvent ev) {
        // intentionally empty
    }

    // ── Public helpers used by service / resource beans ─────────────────────

    public void recordHabitCreated() {
        habitCreatedCounter.increment();
    }

    public void recordHabitDeleted() {
        habitDeletedCounter.increment();
    }

    /**
     * Start a habit request roundtrip sample. Pass the returned {@link Timer.Sample}
     * to {@link #stopSyncRoundtrip(Timer.Sample)} after the cycle completes.
     */
    public Timer.Sample startSyncRoundtrip() {
        return Timer.start(registry);
    }

    public void stopSyncRoundtrip(Timer.Sample sample) {
        sample.stop(habitSyncRoundtripTimer);
    }
}
