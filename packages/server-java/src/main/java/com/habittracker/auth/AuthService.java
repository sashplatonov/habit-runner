package com.habittracker.auth;

import com.habittracker.model.OAuthStateEntity;
import com.habittracker.model.RefreshTokenEntity;
import com.habittracker.model.UserEntity;
import io.quarkus.hibernate.orm.panache.Panache;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;

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
  String googleClientId;

  @ConfigProperty(name = "auth.google-client-secret")
  String googleClientSecret;

  final JwtUtil jwtUtil;

  public AuthService(JwtUtil jwtUtil) {
    this.jwtUtil = jwtUtil;
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
    Panache.executeUpdate("update RefreshTokenEntity set revoked=true where token=?1", token);
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
    user.timezone = request.timezone();
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
        + "?client_id=" + urlEncode(googleClientId)
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
      throw new NotAuthorizedException("Invalid OAuth state");
    }

    var email = "google-" + state.substring(0, Math.min(12, state.length())) + "@oauth.habbit-runner.local";
    var user = (UserEntity) UserEntity.find("email", email).firstResult();
    if (user == null) {
      user = new UserEntity();
      user.email = email;
      user.persist();
    }

    var session = issueTokenPair(user);
    return URI.create(stateEntity.returnTo + "/auth/callback"
        + "?accessToken=" + urlEncode(session.accessToken())
        + "&refreshToken=" + urlEncode(session.refreshToken())
        + "&expiresIn=" + session.expiresIn()
        + "&email=" + urlEncode(user.email)).toString();
  }

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
    if (value == null) {
      return "cloud";
    }
    for (var theme : THEME_IDS) {
      if (theme.equals(value)) {
        return theme;
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
      return parsed.getScheme() + "://" + parsed.getAuthority();
    } catch (RuntimeException ex) {
      return oauthDefaultReturnTo;
    }
  }

  private String getOAuthCallbackUrl() {
    return apiPublicUrl + "/auth/google/callback";
  }

  private void ensureGoogleConfig() {
    if (googleClientId == null || googleClientId.isBlank() || googleClientSecret == null || googleClientSecret.isBlank()) {
      throw new NotAuthorizedException("Google OAuth is not configured");
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
