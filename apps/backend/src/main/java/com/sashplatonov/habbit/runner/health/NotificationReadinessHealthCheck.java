package com.sashplatonov.habbit.runner.health;

import com.sashplatonov.habbit.runner.notification.NotificationConfig;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Readiness;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@Readiness
@ApplicationScoped
public class NotificationReadinessHealthCheck implements HealthCheck {
  private final NotificationConfig notificationConfig;

  @Inject
  public NotificationReadinessHealthCheck(NotificationConfig notificationConfig) {
    this.notificationConfig = notificationConfig;
  }

  @Override
  public HealthCheckResponse call() {
    var vapidPublicKey = notificationConfig.vapidPublicKey().orElse(null);
    if (isBlank(vapidPublicKey)) {
      return HealthCheckResponse.named("notification-config")
          .up()
          .withData("status", "disabled")
          .withData("reason", "notification.vapid-public-key is missing")
          .build();
    }
    return HealthCheckResponse.named("notification-config")
        .up()
        .withData("status", "enabled")
        .build();
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
