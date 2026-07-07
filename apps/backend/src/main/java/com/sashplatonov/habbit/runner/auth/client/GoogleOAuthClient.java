package com.sashplatonov.habbit.runner.auth.client;

import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
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

  @Inject
  public GoogleOAuthClient(AuthConfig authConfig, ObjectMapper objectMapper) {
    this(authConfig, objectMapper, HttpClient.newBuilder()
        .connectTimeout(REQUEST_TIMEOUT)
        .build());
  }

  GoogleOAuthClient(AuthConfig authConfig, ObjectMapper objectMapper, HttpClient httpClient) {
    this.authConfig = authConfig;
    this.objectMapper = objectMapper;
    this.httpClient = httpClient;
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
    try {
      var accessToken = exchangeCodeForAccessToken(code, callbackUrl);
      return fetchEmail(accessToken);
    } catch (NotAuthorizedException | BadRequestException exception) {
      throw exception;
    } catch (IOException exception) {
      log.error("Google OAuth exchange failed: provider=google, stage=network-io", exception);
      throw new NotAuthorizedException("OAuth exchange error: " + exception.getMessage(), exception);
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      log.error("Google OAuth exchange failed: provider=google, stage=interrupted", exception);
      throw new NotAuthorizedException("OAuth exchange interrupted", exception);
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

    var request = HttpRequest.newBuilder()
        .uri(URI.create(TOKEN_URL))
        .header("Content-Type", FORM_CONTENT_TYPE)
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .timeout(REQUEST_TIMEOUT)
        .build();

    var startedAt = System.nanoTime();
    var response = httpClient.send(request, STRING_BODY_HANDLER);
    var elapsedMs = elapsedMs(startedAt);
    if (response.statusCode() != 200) {
      log.warn(
          "Google token exchange failed: provider=google, status={}, elapsed={}ms",
          response.statusCode(),
          elapsedMs
      );
      throw new NotAuthorizedException("Google token exchange failed: " + response.statusCode());
    }
    logSlowCall("token-exchange", elapsedMs);

    var tokenResponse = objectMapper.readValue(response.body(), GoogleTokenResponse.class);
    var accessToken = tokenResponse.access_token();
    if (accessToken == null || accessToken.isBlank()) {
      log.warn("Google token exchange returned no access token: provider=google, elapsed={}ms", elapsedMs);
      throw new NotAuthorizedException("Google did not return an access_token");
    }
    return accessToken;
  }

  private String fetchEmail(String accessToken) throws IOException, InterruptedException {
    var request = HttpRequest.newBuilder()
        .uri(URI.create(USER_INFO_URL))
        .header("Authorization", "Bearer " + accessToken)
        .GET()
        .timeout(REQUEST_TIMEOUT)
        .build();

    var startedAt = System.nanoTime();
    var response = httpClient.send(request, STRING_BODY_HANDLER);
    var elapsedMs = elapsedMs(startedAt);
    if (response.statusCode() != 200) {
      log.warn(
          "Google user info request failed: provider=google, status={}, elapsed={}ms",
          response.statusCode(),
          elapsedMs
      );
      throw new NotAuthorizedException("Failed to fetch Google userinfo: " + response.statusCode());
    }
    logSlowCall("user-info", elapsedMs);

    var userInfo = objectMapper.readValue(response.body(), GoogleUserInfoResponse.class);
    var email = userInfo.email();
    if (email == null || email.isBlank()) {
      log.warn("Google user info response did not include email: provider=google, elapsed={}ms", elapsedMs);
      throw new NotAuthorizedException("Google userinfo did not include email");
    }
    return email;
  }

  private void logSlowCall(String operation, long elapsedMs) {
    if (elapsedMs > SLOW_OAUTH_CALL_THRESHOLD_MS) {
      log.warn(
          "Slow Google OAuth call detected: provider=google, operation={}, elapsed={}ms, threshold={}ms",
          operation,
          elapsedMs,
          SLOW_OAUTH_CALL_THRESHOLD_MS
      );
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
