package com.sashplatonov.habbit.runner.metrics.instrumentation;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ServiceMetricsInstrumentationTest {
  @Test
  void shouldRegisterAndRecordServiceMetrics() {
    var registry = new SimpleMeterRegistry();
    var instrumentation = new ServiceMetricsInstrumentation(registry, "test-service", "1.2.3", "test");

    instrumentation.record(ServiceMetric.HABIT_CREATED);
    instrumentation.measureMutation(() -> "done");
    instrumentation.measureMutation(() -> { });
    var successSample = instrumentation.startGoogleOAuthExchange();
    instrumentation.stopGoogleOAuthExchange(successSample, true);
    var failureSample = instrumentation.startGoogleOAuthExchange();
    instrumentation.stopGoogleOAuthExchange(failureSample, false);

    assertEquals(1.0, registry.get("habittracker.habit.created").counter().count());
    assertEquals(1, registry.find("habittracker.mutations.request.roundtrip").timers().size());
    assertEquals(2, registry.find("habittracker.oauth.google.exchange.latency").timers().size());
  }

  @Test
  void shouldAlwaysStopMutationTimerWhenActionFails() {
    var registry = new SimpleMeterRegistry();
    var instrumentation = new ServiceMetricsInstrumentation(registry, "test-service", "1.2.3", "test");

    assertThrows(IllegalStateException.class, () -> instrumentation.measureMutation(() -> {
      throw new IllegalStateException("boom");
    }));

    assertEquals(1, registry.find("habittracker.mutations.request.roundtrip").timers().size());
  }
}
