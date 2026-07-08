package com.sashplatonov.habbit.runner.metrics.instrumentation;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tag;
import io.micrometer.core.instrument.Timer;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@ApplicationScoped
public class ServiceMetricsInstrumentation {

  private final MeterRegistry registry;
  private final Map<ServiceMetric, Counter> counters;
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
      String environment
  ) {
    this.registry = registry;
    this.counters = new EnumMap<>(ServiceMetric.class);
    registerCounters(serviceName, serviceVersion, environment);
    this.mutationTimer = registerTimer(new MetricDefinition(
        "habittracker.mutations.request.roundtrip",
        "Wall-clock duration of a full mutation request in the service layer",
        "mutation",
        "success",
        "internal"
    ), serviceName, serviceVersion, environment);
    this.googleOAuthExchangeSuccessTimer = registerTimer(new MetricDefinition(
        "habittracker.oauth.google.exchange.latency",
        "Latency of a successful Google OAuth exchange",
        "exchange",
        "success",
        "google"
    ), serviceName, serviceVersion, environment);
    this.googleOAuthExchangeFailureTimer = registerTimer(new MetricDefinition(
        "habittracker.oauth.google.exchange.latency",
        "Latency of a failed Google OAuth exchange",
        "exchange",
        "failure",
        "google"
    ), serviceName, serviceVersion, environment);
  }

  public void record(ServiceMetric metric) {
    counters.get(metric).increment();
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

  private void registerCounters(String serviceName, String serviceVersion, String environment) {
    for (var metric : ServiceMetric.values()) {
      counters.put(metric, registerCounter(metric.definition(), serviceName, serviceVersion, environment));
    }
  }

  private Counter registerCounter(
      MetricDefinition definition,
      String serviceName,
      String serviceVersion,
      String environment
  ) {
    return Counter.builder(definition.metricName())
        .description(definition.description())
        .tags(metricTags(definition, serviceName, serviceVersion, environment))
        .register(registry);
  }

  private Timer registerTimer(
      MetricDefinition definition,
      String serviceName,
      String serviceVersion,
      String environment
  ) {
    return Timer.builder(definition.metricName())
        .description(definition.description())
        .tags(metricTags(definition, serviceName, serviceVersion, environment))
        .publishPercentileHistogram()
        .register(registry);
  }

  private List<Tag> metricTags(
      MetricDefinition definition,
      String serviceName,
      String serviceVersion,
      String environment
  ) {
    return List.of(
        Tag.of("service.name", serviceName),
        Tag.of("service.version", serviceVersion),
        Tag.of("deployment.environment", environment),
        Tag.of("operation", definition.operation()),
        Tag.of("outcome", definition.outcome()),
        Tag.of("provider", definition.provider())
    );
  }
}
