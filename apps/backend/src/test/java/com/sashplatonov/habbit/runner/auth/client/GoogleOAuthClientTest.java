package com.sashplatonov.habbit.runner.auth.client;

import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import com.sashplatonov.habbit.runner.api.RequestTraceFilter;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetricsInstrumentation;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
import com.sashplatonov.habbit.runner.support.FakeHttpClient;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class GoogleOAuthClientTest {

  private final ObjectMapper objectMapper = new ObjectMapper();
  private final ServiceMetricsInstrumentation metrics = mock(ServiceMetricsInstrumentation.class);

  private GoogleOAuthClient client(AuthConfig config, java.net.http.HttpClient httpClient) {
    return new GoogleOAuthClient(config, objectMapper, httpClient, metrics);
  }

  @Test
  void shouldBuildAuthorizationUrlWhenGoogleOauthIsConfigured() {
    var client = client(TestConfigFactory.defaultAuthConfig(), new FakeHttpClient());

    var url = client.buildAuthorizationUrl("state-token", "https://app.example.test/auth/callback");

    assertTrue(url.startsWith("https://accounts.google.com/o/oauth2/v2/auth?client_id="));
    assertTrue(url.contains("state=state-token"));
    assertTrue(url.contains("redirect_uri=https%3A%2F%2Fapp.example.test%2Fauth%2Fcallback"));
  }

  @Test
  void shouldRejectAuthorizationUrlWhenGoogleOauthIsMissing() {
    var client = client(blankGoogleConfig(), new FakeHttpClient());

    var exception = assertThrows(
        BadRequestException.class,
        () -> client.buildAuthorizationUrl("state-token", "https://app.example.test/auth/callback")
    );

    assertEquals("Google OAuth is not configured on this server", exception.getMessage());
  }

  @Test
  void shouldReturnEmailWhenGoogleExchangeSucceeds() {
    var httpClient = new FakeHttpClient()
        .enqueueResponse(200, "{\"access_token\":\"token-123\"}")
        .enqueueResponse(200, "{\"email\":\"user@example.test\"}");
    var client = client(TestConfigFactory.defaultAuthConfig(), httpClient);

    var email = client.exchangeCodeForEmail("code-123", "https://app.example.test/auth/callback");

    assertEquals("user@example.test", email);
    assertEquals(2, httpClient.requestCount());
    assertEquals("POST", httpClient.requestAt(0).method());
    assertEquals("GET", httpClient.requestAt(1).method());
    assertTrue(httpClient.requestAt(1).headers().firstValue("Authorization").orElseThrow().startsWith("Bearer token-123"));
  }

  @Test
  void shouldPropagateTraceIdToGoogleRequests() {
    var httpClient = new FakeHttpClient()
        .enqueueResponse(200, "{\"access_token\":\"token-123\"}")
        .enqueueResponse(200, "{\"email\":\"user@example.test\"}");
    var client = client(TestConfigFactory.defaultAuthConfig(), httpClient);
    MDC.put("traceId", "trace-123");

    try {
      client.exchangeCodeForEmail("code-123", "https://app.example.test/auth/callback");

      assertEquals("trace-123", httpClient.requestAt(0).headers().firstValue(RequestTraceFilter.TRACE_ID_HEADER).orElseThrow());
      assertEquals("trace-123", httpClient.requestAt(1).headers().firstValue(RequestTraceFilter.TRACE_ID_HEADER).orElseThrow());
    } finally {
      MDC.remove("traceId");
    }
  }

  @Test
  void shouldRejectWhenGoogleTokenExchangeReturnsNonSuccessStatus() {
    var client = client(
        TestConfigFactory.defaultAuthConfig(),
        new FakeHttpClient().enqueueResponse(401, "{}")
    );

    assertThrows(
      NotAuthorizedException.class,
      () -> client.exchangeCodeForEmail("code-123", "https://app.example.test/auth/callback")
    );
  }

  @Test
  void shouldRejectWhenGoogleTokenExchangeReturnsNoAccessToken() {
    var client = client(
        TestConfigFactory.defaultAuthConfig(),
        new FakeHttpClient().enqueueResponse(200, "{\"token_type\":\"Bearer\"}")
    );

    assertThrows(
      NotAuthorizedException.class,
      () -> client.exchangeCodeForEmail("code-123", "https://app.example.test/auth/callback")
    );
  }

  @Test
  void shouldRejectWhenGoogleUserInfoReturnsNonSuccessStatus() {
    var client = client(
        TestConfigFactory.defaultAuthConfig(),
        new FakeHttpClient()
            .enqueueResponse(200, "{\"access_token\":\"token-123\"}")
            .enqueueResponse(403, "{}")
    );

    assertThrows(
      NotAuthorizedException.class,
      () -> client.exchangeCodeForEmail("code-123", "https://app.example.test/auth/callback")
    );
  }

  @Test
  void shouldRejectWhenGoogleUserInfoReturnsNoEmail() {
    var client = client(
        TestConfigFactory.defaultAuthConfig(),
        new FakeHttpClient()
            .enqueueResponse(200, "{\"access_token\":\"token-123\"}")
            .enqueueResponse(200, "{\"sub\":\"123\"}")
    );

    assertThrows(
      NotAuthorizedException.class,
      () -> client.exchangeCodeForEmail("code-123", "https://app.example.test/auth/callback")
    );
  }

  @Test
  void shouldWrapIoFailuresDuringGoogleExchange() {
    var client = client(
        TestConfigFactory.defaultAuthConfig(),
        new FakeHttpClient().enqueueFailure(new IOException("network-down"))
    );

    var exception = assertThrows(
        NotAuthorizedException.class,
        () -> client.exchangeCodeForEmail("code-123", "https://app.example.test/auth/callback")
    );

    assertEquals("OAuth exchange error: network-down", exception.getMessage());
  }

  @Test
  void shouldWrapInterruptedGoogleExchangeAndRestoreThreadInterrupt() {
    var client = client(
        TestConfigFactory.defaultAuthConfig(),
        new FakeHttpClient().enqueueFailure(new InterruptedException("interrupted"))
    );

    var exception = assertThrows(
        NotAuthorizedException.class,
        () -> client.exchangeCodeForEmail("code-123", "https://app.example.test/auth/callback")
    );

    assertEquals("OAuth exchange interrupted", exception.getMessage());
    assertTrue(Thread.currentThread().isInterrupted());
    Thread.interrupted();
  }

  private AuthConfig blankGoogleConfig() {
    return new AuthConfig() {
      @Override
      public String secret() {
        return TestConfigFactory.defaultAuthConfig().secret();
      }

      @Override
      public int accessTokenTtlSeconds() {
        return 3600;
      }

      @Override
      public int refreshTokenDays() {
        return 30;
      }

      @Override
      public String apiPublicUrl() {
        return "https://api.example.test";
      }

      @Override
      public String oauthDefaultReturnTo() {
        return "https://app.example.test";
      }

      @Override
      public Optional<String> googleClientId() {
        return Optional.empty();
      }

      @Override
      public Optional<String> googleClientSecret() {
        return Optional.empty();
      }

      @Override
      public String issuer() {
        return "habittracker-test";
      }

      public Optional<String> telegramBotToken() {
        return Optional.empty();
      }

      public long telegramInitDataMaxAgeSeconds() {
        return 86400L;
      }
    };
  }

}
