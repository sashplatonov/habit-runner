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
    private final String serviceName;
    private final String serviceVersion;
    private final String environment;

    private final Counter habitCreatedCounter;
    private final Counter habitUpdatedCounter;
    private final Counter habitDeletedCounter;
    private final Counter checkinUpsertedCounter;
    private final Counter checkinDeletedCounter;
    private final Counter authLoginSuccessEmailCounter;
    private final Counter authLoginSuccessGoogleCounter;
    private final Counter authLoginFailureEmailCounter;
    private final Counter authRefreshSuccessCounter;
    private final Counter oauthGoogleFailureCounter;
    private final Counter pushSubscriptionCreatedCounter;
    private final Counter pushSubscriptionDeletedCounter;

    private final Timer mutationTimer;
    private final Timer googleOAuthExchangeSuccessTimer;
    private final Timer googleOAuthExchangeFailureTimer;

    ServiceMetricsInstrumentation(
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

        this.habitCreatedCounter = createHabitCreatedCounter();
        this.habitUpdatedCounter = createHabitUpdatedCounter();
        this.habitDeletedCounter = createHabitDeletedCounter();
        this.checkinUpsertedCounter = createCheckinUpsertedCounter();
        this.checkinDeletedCounter = createCheckinDeletedCounter();
        this.authLoginSuccessEmailCounter = createAuthLoginSuccessEmailCounter();
        this.authLoginSuccessGoogleCounter = createAuthLoginSuccessGoogleCounter();
        this.authLoginFailureEmailCounter = createAuthLoginFailureEmailCounter();
        this.authRefreshSuccessCounter = createAuthRefreshSuccessCounter();
        this.oauthGoogleFailureCounter = createOAuthGoogleFailureCounter();
        this.pushSubscriptionCreatedCounter = createPushSubscriptionCreatedCounter();
        this.pushSubscriptionDeletedCounter = createPushSubscriptionDeletedCounter();
        this.mutationTimer = createMutationTimer();
        this.googleOAuthExchangeSuccessTimer = createGoogleOAuthExchangeSuccessTimer();
        this.googleOAuthExchangeFailureTimer = createGoogleOAuthExchangeFailureTimer();
    }

    public void recordHabitCreated() {
        habitCreatedCounter.increment();
    }

    public void recordHabitUpdated() {
        habitUpdatedCounter.increment();
    }

    public void recordHabitDeleted() {
        habitDeletedCounter.increment();
    }

    public void recordCheckinUpserted() {
        checkinUpsertedCounter.increment();
    }

    public void recordCheckinDeleted() {
        checkinDeletedCounter.increment();
    }

    public void recordAuthLoginSuccessEmail() {
        authLoginSuccessEmailCounter.increment();
    }

    public void recordAuthLoginSuccessGoogle() {
        authLoginSuccessGoogleCounter.increment();
    }

    public void recordAuthLoginFailureEmail() {
        authLoginFailureEmailCounter.increment();
    }

    public void recordAuthRefreshSuccess() {
        authRefreshSuccessCounter.increment();
    }

    public void recordOAuthGoogleFailure() {
        oauthGoogleFailureCounter.increment();
    }

    public void recordPushSubscriptionCreated() {
        pushSubscriptionCreatedCounter.increment();
    }

    public void recordPushSubscriptionDeleted() {
        pushSubscriptionDeletedCounter.increment();
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

    public Timer.Sample startGoogleOAuthExchange() {
        return Timer.start(registry);
    }

    public void stopGoogleOAuthExchange(Timer.Sample sample, boolean success) {
        sample.stop(success ? googleOAuthExchangeSuccessTimer : googleOAuthExchangeFailureTimer);
    }

    private Counter counter(String metricName, String description, String operation, String outcome, String provider) {
        return Counter.builder(metricName)
                .description(description)
                .tags(metricTags(operation, outcome, provider))
                .register(registry);
    }

    private Counter createHabitCreatedCounter() {
        return counter("habittracker.habit.created", "Habits created via the service layer", "create", "success", "internal");
    }

    private Counter createHabitUpdatedCounter() {
        return counter("habittracker.habit.updated", "Habits updated via the service layer", "update", "success", "internal");
    }

    private Counter createHabitDeletedCounter() {
        return counter("habittracker.habit.deleted", "Habits deleted via the service layer", "delete", "success", "internal");
    }

    private Counter createCheckinUpsertedCounter() {
        return counter("habittracker.checkin.upserted", "Checkins upserted via the service layer", "upsert", "success", "internal");
    }

    private Counter createCheckinDeletedCounter() {
        return counter("habittracker.checkin.deleted", "Checkins deleted via the service layer", "delete", "success", "internal");
    }

    private Counter createAuthLoginSuccessEmailCounter() {
        return counter("habittracker.auth.login.success", "Successful email logins", "login", "success", "email");
    }

    private Counter createAuthLoginSuccessGoogleCounter() {
        return counter("habittracker.auth.login.success", "Successful Google logins", "login", "success", "google");
    }

    private Counter createAuthLoginFailureEmailCounter() {
        return counter("habittracker.auth.login.failure", "Failed email logins", "login", "failure", "email");
    }

    private Counter createAuthRefreshSuccessCounter() {
        return counter("habittracker.auth.refresh.success", "Successful refresh-token exchanges", "refresh", "success", "refresh-token");
    }

    private Counter createOAuthGoogleFailureCounter() {
        return counter("habittracker.oauth.google.failure", "Failed Google OAuth exchanges", "exchange", "failure", "google");
    }

    private Counter createPushSubscriptionCreatedCounter() {
        return counter("habittracker.push.subscription.created", "Created push subscriptions", "subscribe", "success", "push");
    }

    private Counter createPushSubscriptionDeletedCounter() {
        return counter("habittracker.push.subscription.deleted", "Deleted push subscriptions", "unsubscribe", "success", "push");
    }

    private Timer timer(String metricName, String description, String operation, String outcome, String provider) {
        return Timer.builder(metricName)
                .description(description)
                .tags(metricTags(operation, outcome, provider))
                .publishPercentileHistogram()
                .register(registry);
    }

    private Timer createMutationTimer() {
        return timer(
                "habittracker.mutations.request.roundtrip",
                "Wall-clock duration of a full mutation request in the service layer",
                "mutation",
                "success",
                "internal"
        );
    }

    private Timer createGoogleOAuthExchangeSuccessTimer() {
        return timer(
                "habittracker.oauth.google.exchange.latency",
                "Latency of a successful Google OAuth exchange",
                "exchange",
                "success",
                "google"
        );
    }

    private Timer createGoogleOAuthExchangeFailureTimer() {
        return timer(
                "habittracker.oauth.google.exchange.latency",
                "Latency of a failed Google OAuth exchange",
                "exchange",
                "failure",
                "google"
        );
    }

    private List<Tag> metricTags(String operation, String outcome, String provider) {
        return List.of(
                Tag.of("service.name", serviceName),
                Tag.of("service.version", serviceVersion),
                Tag.of("deployment.environment", environment),
                Tag.of("operation", operation),
                Tag.of("outcome", outcome),
                Tag.of("provider", provider)
        );
    }
}
