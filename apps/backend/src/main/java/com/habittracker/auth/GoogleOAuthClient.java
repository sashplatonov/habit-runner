package com.habittracker.auth;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

@ApplicationScoped
public class GoogleOAuthClient {
  private static final String AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
  private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
  private static final String USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
  private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);
  private static final Logger LOG = Logger.getLogger(GoogleOAuthClient.class);

  private final AuthConfig authConfig;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public GoogleOAuthClient(AuthConfig authConfig, ObjectMapper objectMapper) {
    this.authConfig = authConfig;
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(REQUEST_TIMEOUT)
        .build();
  }

  public String buildAuthorizationUrl(String state, String callbackUrl) {
    ensureConfigured();
    return AUTHORIZATION_URL
        + "?client_id=" + urlEncode(requiredClientId())
        + "&redirect_uri=" + urlEncode(callbackUrl)
        + "&response_type=code"
        + "&scope=" + urlEncode("openid email profile")
        + "&state=" + urlEncode(state)
        + "&access_type=offline&prompt=select_account";
  }

  public String exchangeCodeForEmail(String code, String callbackUrl) {
    try {
      var accessToken = exchangeCodeForAccessToken(code, callbackUrl);
      return fetchEmail(accessToken);
    } catch (NotAuthorizedException | BadRequestException exception) {
      LOG.debugf("Google OAuth exchange rejected: reason=%s", exception.getMessage());
      throw exception;
    } catch (IOException exception) {
      LOG.warnf(exception, "Google OAuth exchange failed due to I/O error");
      throw new NotAuthorizedException("OAuth exchange error: " + exception.getMessage(), exception);
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      LOG.warn("Google OAuth exchange interrupted", exception);
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
    var body = "code=" + urlEncode(code)
        + "&client_id=" + urlEncode(requiredClientId())
        + "&client_secret=" + urlEncode(requiredClientSecret())
        + "&redirect_uri=" + urlEncode(callbackUrl)
        + "&grant_type=authorization_code";

    var request = HttpRequest.newBuilder()
        .uri(URI.create(TOKEN_URL))
        .header("Content-Type", "application/x-www-form-urlencoded")
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .timeout(REQUEST_TIMEOUT)
        .build();

    var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() != 200) {
      LOG.warnf("Google token exchange failed: status=%d", response.statusCode());
      throw new NotAuthorizedException("Google token exchange failed: " + response.statusCode());
    }

    var tokenMap = objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {
    });
    var accessToken = (String) tokenMap.get("access_token");
    if (accessToken == null || accessToken.isBlank()) {
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

    var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() != 200) {
      LOG.warnf("Failed to fetch Google user info: status=%d", response.statusCode());
      throw new NotAuthorizedException("Failed to fetch Google userinfo: " + response.statusCode());
    }

    var userInfoMap = objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {
    });
    var email = (String) userInfoMap.get("email");
    if (email == null || email.isBlank()) {
      throw new NotAuthorizedException("Google userinfo did not include email");
    }
    return email;
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
