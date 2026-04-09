package com.habittracker.auth;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class GoogleOAuthClient {
  private static final String AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
  private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
  private static final String USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

  @ConfigProperty(name = "auth.google-client-id")
  Optional<String> googleClientId;

  @ConfigProperty(name = "auth.google-client-secret")
  Optional<String> googleClientSecret;

  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public GoogleOAuthClient(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
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
      throw exception;
    } catch (IOException exception) {
      throw new NotAuthorizedException("OAuth exchange error: " + exception.getMessage(), exception);
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new NotAuthorizedException("OAuth exchange interrupted", exception);
    }
  }

  public void ensureConfigured() {
    if (googleClientId.map(String::isBlank).orElse(true)
        || googleClientSecret.map(String::isBlank).orElse(true)) {
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
        .timeout(Duration.ofSeconds(10))
        .build();

    var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() != 200) {
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
        .timeout(Duration.ofSeconds(10))
        .build();

    var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() != 200) {
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
    return googleClientId.orElseThrow();
  }

  private String requiredClientSecret() {
    return googleClientSecret.orElseThrow();
  }

  private String urlEncode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
