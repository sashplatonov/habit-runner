package com.sashplatonov.habbit.runner.health;

import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@Readiness
@ApplicationScoped
public class AuthReadinessHealthCheck implements HealthCheck {
  private final AuthConfig authConfig;

  @Inject
  public AuthReadinessHealthCheck(AuthConfig authConfig) {
    this.authConfig = authConfig;
  }

  @Override
  public HealthCheckResponse call() {
    if (isBlank(authConfig.secret())) {
      return down("auth.secret is missing");
    }
    if (authConfig.accessTokenTtlSeconds() < 1) {
      return down("auth.access-token-ttl-seconds must be positive");
    }
    if (authConfig.refreshTokenDays() < 1) {
      return down("auth.refresh-token-days must be positive");
    }
    if (isBlank(authConfig.apiPublicUrl())) {
      return down("auth.api-public-url is missing");
    }
    if (isBlank(authConfig.oauthDefaultReturnTo())) {
      return down("auth.oauth-default-return-to is missing");
    }
    if (isBlank(authConfig.issuer())) {
      return down("auth.issuer is missing");
    }
    return HealthCheckResponse.up("auth-config");
  }

  private HealthCheckResponse down(String message) {
    return HealthCheckResponse.named("auth-config")
        .down()
        .withData("reason", message)
        .build();
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
