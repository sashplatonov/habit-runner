package com.sashplatonov.habbit.runner.health;

import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import com.sashplatonov.habbit.runner.notification.NotificationConfig;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HealthReadinessTest {
  @Test
  void shouldReportAuthConfigUpAndDownStates() {
    var authConfig = mock(AuthConfig.class);
    stubValidAuthConfig(authConfig);

    var healthCheck = new AuthReadinessHealthCheck(authConfig);
    var up = healthCheck.call();

    assertEquals(HealthCheckResponse.Status.UP, up.getStatus());

    when(authConfig.secret()).thenReturn("");
    assertDownReason(healthCheck.call(), "auth.secret is missing");

    stubValidAuthConfig(authConfig);
    when(authConfig.accessTokenTtlSeconds()).thenReturn(0);
    assertDownReason(healthCheck.call(), "auth.access-token-ttl-seconds must be positive");

    stubValidAuthConfig(authConfig);
    when(authConfig.refreshTokenDays()).thenReturn(0);
    assertDownReason(healthCheck.call(), "auth.refresh-token-days must be positive");

    stubValidAuthConfig(authConfig);
    when(authConfig.apiPublicUrl()).thenReturn(null);
    assertDownReason(healthCheck.call(), "auth.api-public-url is missing");

    stubValidAuthConfig(authConfig);
    when(authConfig.oauthDefaultReturnTo()).thenReturn(" ");
    assertDownReason(healthCheck.call(), "auth.oauth-default-return-to is missing");

    stubValidAuthConfig(authConfig);
    when(authConfig.issuer()).thenReturn("");
    assertDownReason(healthCheck.call(), "auth.issuer is missing");
  }

  @Test
  void shouldReportNotificationConfigUpAndDownStates() {
    var notificationConfig = mock(NotificationConfig.class);
    when(notificationConfig.vapidPublicKey()).thenReturn(Optional.of("public-key"));

    var healthCheck = new NotificationReadinessHealthCheck(notificationConfig);
    var up = healthCheck.call();

    assertEquals(HealthCheckResponse.Status.UP, up.getStatus());

    when(notificationConfig.vapidPublicKey()).thenReturn(Optional.empty());
    var down = healthCheck.call();

    assertEquals(HealthCheckResponse.Status.DOWN, down.getStatus());
    assertTrue(down.getData().orElseThrow().containsValue("notification.vapid-public-key is missing"));
  }

  private void stubValidAuthConfig(AuthConfig authConfig) {
    when(authConfig.secret()).thenReturn("secret");
    when(authConfig.accessTokenTtlSeconds()).thenReturn(3600);
    when(authConfig.refreshTokenDays()).thenReturn(30);
    when(authConfig.apiPublicUrl()).thenReturn("https://api.example.test");
    when(authConfig.oauthDefaultReturnTo()).thenReturn("https://app.example.test");
    when(authConfig.issuer()).thenReturn("issuer");
  }

  private void assertDownReason(HealthCheckResponse response, String reason) {
    assertEquals(HealthCheckResponse.Status.DOWN, response.getStatus());
    assertTrue(response.getData().orElseThrow().containsValue(reason));
  }
}
