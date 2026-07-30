package com.sashplatonov.habbit.runner.health;

import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import com.sashplatonov.habbit.runner.notification.NotificationConfig;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HealthReadinessTest {
  @Test
  void shouldReportAuthConfigUpAndDownStates() {
    var authConfig = mock(AuthConfig.class);
    stubValidAuthConfig(authConfig);

    var healthCheck = authHealthCheck(authConfig, "development");
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
  void shouldRejectInsecureProductionAuthDefaults() {
    var authConfig = mock(AuthConfig.class);
    stubProductionUnsafeAuthConfig(authConfig);

    var validator = new AuthConfigurationValidator(authConfig, " production ");
    var healthCheck = new AuthReadinessHealthCheck(validator);

    assertDownReason(healthCheck.call(), "auth.secret is too weak for production");
    assertThrows(IllegalStateException.class, () -> validator.validateOnStartup(null));

    when(authConfig.secret()).thenReturn("a".repeat(32));
    assertDownReason(healthCheck.call(), "auth.google-client-id is missing");

    when(authConfig.googleClientId()).thenReturn(Optional.of("client-id"));
    assertDownReason(healthCheck.call(), "auth.google-client-secret is missing");

    when(authConfig.googleClientSecret()).thenReturn(Optional.of("client-secret"));
    assertDownReason(healthCheck.call(), "auth.api-public-url must not point to localhost in production");

    when(authConfig.apiPublicUrl()).thenReturn("https://api.example.test");
    assertDownReason(healthCheck.call(), "auth.oauth-default-return-to must not point to localhost in production");

    when(authConfig.oauthDefaultReturnTo()).thenReturn("https://app.example.test");
    assertEquals(HealthCheckResponse.Status.UP, healthCheck.call().getStatus());

    when(authConfig.apiPublicUrl()).thenReturn("https://localhost.example.test");
    assertEquals(HealthCheckResponse.Status.UP, healthCheck.call().getStatus());

    when(authConfig.apiPublicUrl()).thenReturn("http://[::1]:8080");
    assertDownReason(healthCheck.call(), "auth.api-public-url must not point to localhost in production");

    when(authConfig.apiPublicUrl()).thenReturn("http://localhost.:8080");
    assertDownReason(healthCheck.call(), "auth.api-public-url must not point to localhost in production");
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
    when(authConfig.googleClientId()).thenReturn(Optional.of("client-id"));
    when(authConfig.googleClientSecret()).thenReturn(Optional.of("client-secret"));
    when(authConfig.issuer()).thenReturn("issuer");
  }

  private void stubProductionUnsafeAuthConfig(AuthConfig authConfig) {
    when(authConfig.secret()).thenReturn("change-me");
    when(authConfig.accessTokenTtlSeconds()).thenReturn(3600);
    when(authConfig.refreshTokenDays()).thenReturn(30);
    when(authConfig.apiPublicUrl()).thenReturn("http://localhost:3000");
    when(authConfig.oauthDefaultReturnTo()).thenReturn("http://localhost:5173");
    when(authConfig.googleClientId()).thenReturn(Optional.empty());
    when(authConfig.googleClientSecret()).thenReturn(Optional.empty());
    when(authConfig.issuer()).thenReturn("issuer");
  }

  private void assertDownReason(HealthCheckResponse response, String reason) {
    assertEquals(HealthCheckResponse.Status.DOWN, response.getStatus());
    assertTrue(response.getData().orElseThrow().containsValue(reason));
  }

  private AuthReadinessHealthCheck authHealthCheck(AuthConfig authConfig, String deploymentEnv) {
    return new AuthReadinessHealthCheck(new AuthConfigurationValidator(authConfig, deploymentEnv));
  }
}
