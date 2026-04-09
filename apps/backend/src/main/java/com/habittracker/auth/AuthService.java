package com.habittracker.auth;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.habittracker.model.OAuthStateEntity;
import com.habittracker.model.RefreshTokenEntity;
import com.habittracker.model.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;

@ApplicationScoped
public class AuthService {
  private static final String[] THEME_IDS = {
      "midnight", "ember", "violet", "matrix", "arctic", "sakura", "lavender", "mint", "peach", "cloud"
  };

  @ConfigProperty(name = "auth.access-token-ttl-seconds")
  int accessTokenTtlSeconds;

  @ConfigProperty(name = "auth.refresh-token-days")
  int refreshTokenDays;

  @ConfigProperty(name = "auth.api-public-url")
  String apiPublicUrl;

  @ConfigProperty(name = "auth.oauth-default-return-to")
  String oauthDefaultReturnTo;

  @ConfigProperty(name = "auth.google-client-id")
  java.util.Optional<String> googleClientId;

  @ConfigProperty(name = "auth.google-client-secret")
  java.util.Optional<String> googleClientSecret;

  final JwtUtil jwtUtil;
  final ObjectMapper objectMapper;
  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(10))
      .build();

  public AuthService(JwtUtil jwtUtil, ObjectMapper objectMapper) {
    this.jwtUtil = jwtUtil;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public AuthDtos.TokenResponse login(String email) {
    var user = UserEntity.find("email", email).firstResult();
    if (user == null) {
      throw new NotAuthorizedException("Unknown user");
    }
    return issueTokenPair((UserEntity) user);
  }

  @Transactional
  public AuthDtos.TokenResponse refreshToken(String token) {
    var record = (RefreshTokenEntity) RefreshTokenEntity.find("token", token).firstResult();
    if (record == null || record.revoked || record.expiresAt.isBefore(Instant.now())) {
      throw new NotAuthorizedException("Refresh token expired or revoked");
    }
    var user = (UserEntity) UserEntity.findById(record.userId);
    if (user == null) {
      throw new NotAuthorizedException("User no longer exists");
    }
    var accessToken = jwtUtil.createAccessToken(user.id, user.email, accessTokenTtlSeconds);
    return new AuthDtos.TokenResponse(accessToken, record.token, accessTokenTtlSeconds, "Bearer");
  }

  @Transactional
  public void revokeToken(String token) {
    var record = (RefreshTokenEntity) RefreshTokenEntity.find("token", token).firstResult();
    if (record != null) {
      record.revoked = true;
    }
  }

  public CurrentUser verifyAccessToken(String token) {
    try {
      return jwtUtil.verify(token);
    } catch (IllegalArgumentException ex) {
      throw new NotAuthorizedException("Invalid token");
    }
  }

  @Transactional
  public AuthDtos.UserPreferencesResponse getUserPreferences(String userId) {
    var user = (UserEntity) UserEntity.findById(userId);
    if (user == null) {
      throw new NotAuthorizedException("User no longer exists");
    }
    return new AuthDtos.UserPreferencesResponse(normalizeTheme(user.theme), user.timezone);
  }

  @Transactional
  public AuthDtos.UserPreferencesResponse updateUserPreferences(String userId, AuthDtos.UpdatePreferencesRequest request) {
    var user = (UserEntity) UserEntity.findById(userId);
    if (user == null) {
      throw new NotAuthorizedException("User no longer exists");
    }
    user.theme = normalizeTheme(request.theme());
    if (request.timezone() != null) {
      user.timezone = request.timezone().isBlank() ? null : request.timezone();
    }
    return new AuthDtos.UserPreferencesResponse(user.theme, user.timezone);
  }

  @Transactional
  public String updateUserTheme(String userId, String theme) {
    var updated = updateUserPreferences(userId, new AuthDtos.UpdatePreferencesRequest(theme, null));
    return updated.theme();
  }

  @Transactional
  public String createOAuthAuthorizationUrl(String returnTo) {
    ensureGoogleConfig();
    var state = randomToken(16);
    var payload = new OAuthStateEntity();
    payload.state = state;
    payload.returnTo = normalizeReturnTo(returnTo);
    payload.expiresAt = Instant.now().plusSeconds(600);
    payload.persist();

    var callback = getOAuthCallbackUrl();
    return "https://accounts.google.com/o/oauth2/v2/auth"
        + "?client_id=" + urlEncode(googleClientId.orElseThrow())
        + "&redirect_uri=" + urlEncode(callback)
        + "&response_type=code"
        + "&scope=" + urlEncode("openid email profile")
        + "&state=" + urlEncode(state)
        + "&access_type=offline&prompt=select_account";
  }

  @Transactional
  public String handleOAuthCallback(String code, String state) {
    if (code == null || code.isBlank() || state == null || state.isBlank()) {
      throw new BadRequestException("Missing OAuth callback parameters");
    }

    var stateEntity = (OAuthStateEntity) OAuthStateEntity.findById(state);
    OAuthStateEntity.deleteById(state);
    if (stateEntity == null || stateEntity.expiresAt.isBefore(Instant.now())) {
      throw new NotAuthorizedException("Invalid or expired OAuth state");
    }

    var email = exchangeCodeForEmail(code);
    var user = (UserEntity) UserEntity.find("email", email).firstResult();
    if (user == null) {
      user = new UserEntity();
      user.email = email;
      user.persist();
    }

    var session = issueTokenPair(user);
    return stateEntity.returnTo + "/auth/callback"
        + "?accessToken=" + urlEncode(session.accessToken())
        + "&refreshToken=" + urlEncode(session.refreshToken())
        + "&expiresIn=" + session.expiresIn()
        + "&email=" + urlEncode(email);
  }

  // ─── Google OAuth helpers ─────────────────────────────────────────────────

  private String exchangeCodeForEmail(String code) {
    try {
      var callback = getOAuthCallbackUrl();
      var body = "code=" + urlEncode(code)
          + "&client_id=" + urlEncode(googleClientId.orElseThrow())
          + "&client_secret=" + urlEncode(googleClientSecret.orElseThrow())
          + "&redirect_uri=" + urlEncode(callback)
          + "&grant_type=authorization_code";

      var tokenReq = HttpRequest.newBuilder()
          .uri(URI.create("https://oauth2.googleapis.com/token"))
          .header("Content-Type", "application/x-www-form-urlencoded")
          .POST(HttpRequest.BodyPublishers.ofString(body))
          .timeout(Duration.ofSeconds(10))
          .build();

      var tokenResp = httpClient.send(tokenReq, HttpResponse.BodyHandlers.ofString());
      if (tokenResp.statusCode() != 200) {
        throw new NotAuthorizedException("Google token exchange failed: " + tokenResp.statusCode());
      }

      var tokenMap = objectMapper.readValue(tokenResp.body(), new TypeReference<Map<String, Object>>() {});
      var accessToken = (String) tokenMap.get("access_token");
      if (accessToken == null || accessToken.isBlank()) {
        throw new NotAuthorizedException("Google did not return an access_token");
      }

      var userInfoReq = HttpRequest.newBuilder()
          .uri(URI.create("https://www.googleapis.com/oauth2/v3/userinfo"))
          .header("Authorization", "Bearer " + accessToken)
          .GET()
          .timeout(Duration.ofSeconds(10))
          .build();

      var userInfoResp = httpClient.send(userInfoReq, HttpResponse.BodyHandlers.ofString());
      if (userInfoResp.statusCode() != 200) {
        throw new NotAuthorizedException("Failed to fetch Google userinfo: " + userInfoResp.statusCode());
      }

      var userInfoMap = objectMapper.readValue(userInfoResp.body(), new TypeReference<Map<String, Object>>() {});
      var email = (String) userInfoMap.get("email");
      if (email == null || email.isBlank()) {
        throw new NotAuthorizedException("Google userinfo did not include email");
      }
      return email;
    } catch (NotAuthorizedException | BadRequestException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new NotAuthorizedException("OAuth exchange error: " + ex.getMessage());
    }
  }

  // ─── Token helpers ────────────────────────────────────────────────────────

  private AuthDtos.TokenResponse issueTokenPair(UserEntity user) {
    var accessToken = jwtUtil.createAccessToken(user.id, user.email, accessTokenTtlSeconds);
    var refreshToken = createRefreshToken(user.id);
    return new AuthDtos.TokenResponse(accessToken, refreshToken, accessTokenTtlSeconds, "Bearer");
  }

  private String createRefreshToken(String userId) {
    var token = randomToken(32);
    var refresh = new RefreshTokenEntity();
    refresh.token = token;
    refresh.userId = userId;
    refresh.revoked = false;
    refresh.expiresAt = Instant.now().plusSeconds((long) refreshTokenDays * 24 * 60 * 60);
    refresh.persist();
    return token;
  }

  private String normalizeTheme(String value) {
    if (value != null) {
      for (var theme : THEME_IDS) {
        if (theme.equals(value)) {
          return theme;
        }
      }
    }
    return "cloud";
  }

  private String normalizeReturnTo(String returnTo) {
    if (returnTo == null || returnTo.isBlank()) {
      return oauthDefaultReturnTo;
    }
    try {
      var parsed = URI.create(returnTo);
      var scheme = parsed.getScheme();
      if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
        return oauthDefaultReturnTo;
      }
      return scheme + "://" + parsed.getAuthority();
    } catch (RuntimeException ex) {
      return oauthDefaultReturnTo;
    }
  }

  private String getOAuthCallbackUrl() {
    return apiPublicUrl + "/auth/google/callback";
  }

  private void ensureGoogleConfig() {
    if (googleClientId.map(String::isBlank).orElse(true)
        || googleClientSecret.map(String::isBlank).orElse(true)) {
      throw new BadRequestException("Google OAuth is not configured on this server");
    }
  }

  private String randomToken(int bytes) {
    var random = new byte[bytes];
    new SecureRandom().nextBytes(random);
    return HexFormat.of().formatHex(random);
  }

  private String urlEncode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
