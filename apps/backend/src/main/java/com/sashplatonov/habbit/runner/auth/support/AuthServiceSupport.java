package com.sashplatonov.habbit.runner.auth.support;

import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetric;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetricsInstrumentation;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Duration;

@ApplicationScoped
public class AuthServiceSupport {
  private final ServiceMetricsInstrumentation serviceMetricsInstrumentation;
  private final AuthRateLimitService authRateLimitService;

  public AuthServiceSupport(
      ServiceMetricsInstrumentation serviceMetricsInstrumentation,
      AuthRateLimitService authRateLimitService
  ) {
    this.serviceMetricsInstrumentation = serviceMetricsInstrumentation;
    this.authRateLimitService = authRateLimitService;
  }

  public void checkAccountRateLimit(
      String operation,
      String accountId,
      int limit,
      Duration window
  ) {
    if (authRateLimitService != null) {
      authRateLimitService.checkAccount(operation, accountId, limit, window);
    }
  }

  public void record(ServiceMetric metric) {
    if (serviceMetricsInstrumentation != null) {
      serviceMetricsInstrumentation.record(metric);
    }
  }
}
