package com.sashplatonov.habbit.runner.auth.client;

import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import com.sashplatonov.habbit.runner.infrastructure.http.TraceContextSupport;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetric;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetricsInstrumentation;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import io.micrometer.core.instrument.Timer;

@ApplicationScoped
@Slf4j
public class GoogleOAuthClient {
  private static final String AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
  private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
  private static final String USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
  private static final String OAUTH_SCOPE = "openid email profile";
  private static final String FORM_CONTENT_TYPE = "application/x-www-form-urlencoded";
  private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);
  private static final long SLOW_OAUTH_CALL_THRESHOLD_MS = 1_500L;
  private static final HttpResponse.BodyHandler<String> STRING_BODY_HANDLER = HttpResponse.BodyHandlers.ofString();

  private final AuthConfig authConfig;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;
  private final ServiceMetricsInstrumentation serviceMetricsInstrumentation;

  @Inject
  public GoogleOAuthClient(
      AuthConfig authConfig,
      ObjectMapper objectMapper,
      ServiceMetricsInstrumentation serviceMetricsInstrumentation
  ) {
    this(
        authConfig,
        objectMapper,
        HttpClient.newBuilder()
            .connectTimeout(REQUEST_TIMEOUT)
            .build(),
        serviceMetricsInstrumentation
    );
  }

  public GoogleOAuthClient(AuthConfig authConfig, ObjectMapper objectMapper) {
    this(authConfig, objectMapper, HttpClient.newBuilder()
        .connectTimeout(REQUEST_TIMEOUT)
        .build(), null);
  }

  GoogleOAuthClient(AuthConfig authConfig, ObjectMapper objectMapper, HttpClient httpClient) {
    this(authConfig, objectMapper, httpClient, null);
  }

  GoogleOAuthClient(
      AuthConfig authConfig,
      ObjectMapper objectMapper,
      HttpClient httpClient,
      ServiceMetricsInstrumentation serviceMetricsInstrumentation
  ) {
    this.authConfig = authConfig;
    this.objectMapper = objectMapper;
    this.httpClient = httpClient;
    this.serviceMetricsInstrumentation = serviceMetricsInstrumentation;
  }

  public String buildAuthorizationUrl(String state, String callbackUrl) {
    var clientId = requiredClientId();
    return AUTHORIZATION_URL
        + "?client_id=" + urlEncode(clientId)
        + "&redirect_uri=" + urlEncode(callbackUrl)
        + "&response_type=code"
        + "&scope=" + urlEncode(OAUTH_SCOPE)
        + "&state=" + urlEncode(state)
        + "&access_type=offline&prompt=select_account";
  }

  public String exchangeCodeForEmail(String code, String callbackUrl) {
    var sample = startGoogleOAuthExchange();
    var success = false;
    try {
      var accessToken = exchangeCodeForAccessToken(code, callbackUrl);
      var email = fetchEmail(accessToken);
      success = true;
      return email;
    } catch (IOException exception) {
      recordOAuthFailure();
      throw logAndWrapIOException(exception);
    } catch (InterruptedException exception) {
      recordOAuthFailure();
      throw logAndWrapInterrupted(exception);
    } finally {
      finishGoogleOAuthExchange(sample, success);
    }
  }

  public void ensureConfigured() {
    if (authConfig.googleClientId().map(String::isBlank).orElse(true)
        || authConfig.googleClientSecret().map(String::isBlank).orElse(true)) {
      throw new BadRequestException("Google OAuth is not configured on this server");
    }
  }

  private String exchangeCodeForAccessToken(String code, String callbackUrl) throws IOException, InterruptedException {
    var clientId = requiredClientId();
    var clientSecret = requiredClientSecret();
    var body = "code=" + urlEncode(code)
        + "&client_id=" + urlEncode(clientId)
        + "&client_secret=" + urlEncode(clientSecret)
        + "&redirect_uri=" + urlEncode(callbackUrl)
        + "&grant_type=authorization_code";

    var requestBuilder = HttpRequest.newBuilder()
        .uri(URI.create(TOKEN_URL))
        .header("Content-Type", FORM_CONTENT_TYPE)
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .timeout(REQUEST_TIMEOUT);
    TraceContextSupport.withCorrelationHeaders(requestBuilder);
    var request = requestBuilder.build();

    var startedAt = System.nanoTime();
    log.debug(
        "Google OAuth request started: provider=google, traceId={}, stage=token-exchange",
        TraceContextSupport.traceIdOrUnknown()
    );
    var response = httpClient.send(request, STRING_BODY_HANDLER);
    var elapsedMs = elapsedMs(startedAt);
    if (response.statusCode() != 200) {
      log.warn(
          "Google token exchange failed: provider=google, traceId={}, status={}, elapsed={}ms",
          TraceContextSupport.traceIdOrUnknown(),
          response.statusCode(),
          elapsedMs
      );
      throw new NotAuthorizedException("Google token exchange failed: " + response.statusCode());
    }
    logSlowCall("token-exchange", elapsedMs);

    var tokenResponse = objectMapper.readValue(response.body(), GoogleTokenResponse.class);
    var accessToken = tokenResponse.access_token();
    if (accessToken == null || accessToken.isBlank()) {
      log.warn(
          "Google token exchange returned no access token: provider=google, traceId={}, elapsed={}ms",
          TraceContextSupport.traceIdOrUnknown(),
          elapsedMs
      );
      throw new NotAuthorizedException("Google did not return an access_token");
    }
    log.debug(
        "Google OAuth request completed: provider=google, traceId={}, stage=token-exchange, elapsed={}ms, status=200",
        TraceContextSupport.traceIdOrUnknown(),
        elapsedMs
    );
    return accessToken;
  }

  private String fetchEmail(String accessToken) throws IOException, InterruptedException {
    var requestBuilder = HttpRequest.newBuilder()
        .uri(URI.create(USER_INFO_URL))
        .header("Authorization", "Bearer " + accessToken)
        .GET()
        .timeout(REQUEST_TIMEOUT);
    TraceContextSupport.withCorrelationHeaders(requestBuilder);
    var request = requestBuilder.build();

    var startedAt = System.nanoTime();
    log.debug(
        "Google OAuth request started: provider=google, traceId={}, stage=user-info",
        TraceContextSupport.traceIdOrUnknown()
    );
    var response = httpClient.send(request, STRING_BODY_HANDLER);
    var elapsedMs = elapsedMs(startedAt);
    if (response.statusCode() != 200) {
      log.warn(
          "Google user info request failed: provider=google, traceId={}, status={}, elapsed={}ms",
          TraceContextSupport.traceIdOrUnknown(),
          response.statusCode(),
          elapsedMs
      );
      throw new NotAuthorizedException("Failed to fetch Google userinfo: " + response.statusCode());
    }
    logSlowCall("user-info", elapsedMs);

    var userInfo = objectMapper.readValue(response.body(), GoogleUserInfoResponse.class);
    var email = userInfo.email();
    if (email == null || email.isBlank()) {
      log.warn(
          "Google user info response did not include email: provider=google, traceId={}, elapsed={}ms",
          TraceContextSupport.traceIdOrUnknown(),
          elapsedMs
      );
      throw new NotAuthorizedException("Google userinfo did not include email");
    }
    log.debug(
        "Google OAuth request completed: provider=google, traceId={}, stage=user-info, elapsed={}ms, status=200",
        TraceContextSupport.traceIdOrUnknown(),
        elapsedMs
    );
    return email;
  }

  private void logSlowCall(String operation, long elapsedMs) {
    if (elapsedMs > SLOW_OAUTH_CALL_THRESHOLD_MS) {
      log.warn(
          "Slow Google OAuth call detected: provider=google, traceId={}, operation={}, elapsed={}ms, threshold={}ms",
          TraceContextSupport.traceIdOrUnknown(),
          operation,
          elapsedMs,
          SLOW_OAUTH_CALL_THRESHOLD_MS
      );
    }
  }

  private Timer.Sample startGoogleOAuthExchange() {
    return serviceMetricsInstrumentation == null ? null : serviceMetricsInstrumentation.startGoogleOAuthExchange();
  }

  private void finishGoogleOAuthExchange(Timer.Sample sample, boolean success) {
    if (sample != null) {
      serviceMetricsInstrumentation.stopGoogleOAuthExchange(sample, success);
    }
  }

  private RuntimeException logAndWrapIOException(IOException exception) {
    log.error(
        "Google OAuth exchange failed: provider=google, traceId={}, stage=network-io, error={}",
        TraceContextSupport.traceIdOrUnknown(),
        exception.getMessage(),
        exception
    );
    return new NotAuthorizedException("OAuth exchange error: " + exception.getMessage(), exception);
  }

  private RuntimeException logAndWrapInterrupted(InterruptedException exception) {
    Thread.currentThread().interrupt();
    log.error(
        "Google OAuth exchange failed: provider=google, traceId={}, stage=interrupted, error={}",
        TraceContextSupport.traceIdOrUnknown(),
        exception.getMessage(),
        exception
    );
    return new NotAuthorizedException("OAuth exchange interrupted", exception);
  }

  private void recordOAuthFailure() {
    if (serviceMetricsInstrumentation != null) {
      serviceMetricsInstrumentation.record(ServiceMetric.OAUTH_GOOGLE_FAILURE);
    }
  }

  private long elapsedMs(long startedAt) {
    return Math.round((System.nanoTime() - startedAt) / 1_000_000.0d);
  }

  private String requiredClientId() {
    return authConfig.googleClientId()
        .filter(value -> !value.isBlank())
        .orElseThrow(() -> new BadRequestException("Google OAuth is not configured on this server"));
  }

  private String requiredClientSecret() {
    return authConfig.googleClientSecret()
        .filter(value -> !value.isBlank())
        .orElseThrow(() -> new BadRequestException("Google OAuth is not configured on this server"));
  }

  private String urlEncode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
