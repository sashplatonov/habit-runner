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
 * also declared in {@code quarkus.micrometer.export.otlp.resource-attributes}
 * so they appear on every exported metric without needing to tag call-sites.
 */
@ApplicationScoped
public class ObservabilityConfig {

    private final MeterRegistry registry;
    private final String serviceName;
    private final String serviceVersion;
    private final String environment;

    // ── Example business metrics ────────────────────────────────────────────
    // Inject these via constructor into service classes that need them, just
    // like SyncMetricsCollector does.  They are registered once here so the
    // common tag set is applied consistently.
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
                .description("Habits created (upserted) via sync push")
                .tags(commonTags)
                .register(registry);

        this.habitDeletedCounter = Counter.builder("habittracker.habits.deleted")
                .description("Habits tombstoned via sync push")
                .tags(commonTags)
                .register(registry);

        this.habitSyncRoundtripTimer = Timer.builder("habittracker.sync.roundtrip")
                .description("Wall-clock duration of a full client sync cycle (push + pull)")
                .tags(commonTags)
                .publishPercentileHistogram()
                .register(registry);
    }

    /**
     * Startup hook kept for future use (e.g. registering gauges for live objects).
     * Common resource labels (service.name, service.version, deployment.environment)
     * are provided externally via Alloy scrape relabelling, so we no longer call
     * {@code registry.config().commonTags()} here.  Applying common tags after the
     * JVM auto-instrumentation meters have already been registered causes Micrometer
     * to throw "Meters that share a name must share tag keys" errors because the
     * auto-registered meters have no tags while newly created meters would carry the
     * common tags â€" violating Micrometer's same-name invariant.
     */
    void onStart(@Observes StartupEvent ev) {
        // intentionally empty – see Javadoc above
    }

    // ── Public helpers used by service / resource beans ─────────────────────

    public void recordHabitCreated() {
        habitCreatedCounter.increment();
    }

    public void recordHabitDeleted() {
        habitDeletedCounter.increment();
    }

    /**
     * Start a sync roundtrip sample.  Pass the returned {@link Timer.Sample}
     * to {@link #stopSyncRoundtrip(Timer.Sample)} after the cycle completes.
     */
    public Timer.Sample startSyncRoundtrip() {
        return Timer.start(registry);
    }

    public void stopSyncRoundtrip(Timer.Sample sample) {
        sample.stop(habitSyncRoundtripTimer);
    }
}
