package com.sashplatonov.habbit.runner.health;

import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@Readiness
@ApplicationScoped
public class AuthReadinessHealthCheck implements HealthCheck {
  private final AuthConfigurationValidator validator;

  @Inject
  AuthReadinessHealthCheck(AuthConfigurationValidator validator) {
    this.validator = validator;
  }

  @Override
  public HealthCheckResponse call() {
    var validationError = validator.validate();
    if (validationError.isPresent()) {
      return down(validationError.orElseThrow());
    }
    return HealthCheckResponse.up("auth-config");
  }

  private HealthCheckResponse down(String message) {
    return HealthCheckResponse.named("auth-config")
        .down()
        .withData("reason", message)
        .build();
  }
}
