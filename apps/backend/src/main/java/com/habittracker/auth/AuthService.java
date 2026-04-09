package com.habittracker.auth;

import com.habittracker.auth.dto.TokenResponse;
import com.habittracker.auth.dto.UpdatePreferencesRequest;
import com.habittracker.auth.dto.UserPreferencesResponse;
import com.habittracker.model.OAuthStateEntity;
import com.habittracker.model.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.time.Instant;

@ApplicationScoped
public class AuthService {
  @ConfigProperty(name = "auth.access-token-ttl-seconds")
  int accessTokenTtlSeconds;

  @ConfigProperty(name = "auth.refresh-token-days")
  int refreshTokenDays;

  @ConfigProperty(name = "auth.api-public-url")
  String apiPublicUrl;

  @ConfigProperty(name = "auth.oauth-default-return-to")
  String oauthDefaultReturnTo;

  private final JwtUtil jwtUtil;
  private final RefreshTokenService refreshTokenService;
  private final GoogleOAuthClient googleOAuthClient;

  public AuthService(
      JwtUtil jwtUtil,
      RefreshTokenService refreshTokenService,
      GoogleOAuthClient googleOAuthClient
  ) {
    this.jwtUtil = jwtUtil;
    this.refreshTokenService = refreshTokenService;
    this.googleOAuthClient = googleOAuthClient;
  }

  @Transactional
  public TokenResponse login(String email) {
    var user = UserEntity.find("email", email).firstResult();
    if (user == null) {
      throw new NotAuthorizedException("Unknown user");
    }
    return issueTokenPair((UserEntity) user);
  }

  @Transactional
  public TokenResponse refreshToken(String token) {
    var record = refreshTokenService.requireActive(token);
    var user = (UserEntity) UserEntity.findById(record.userId);
    if (user == null) {
      throw new NotAuthorizedException("User no longer exists");
    }
    var accessToken = jwtUtil.createAccessToken(user.id, user.email, accessTokenTtlSeconds);
    return new TokenResponse(accessToken, record.token, accessTokenTtlSeconds, "Bearer");
  }

  @Transactional
  public void revokeToken(String token) {
    refreshTokenService.revoke(token);
  }

  public CurrentUser verifyAccessToken(String token) {
    try {
      return jwtUtil.verify(token);
    } catch (IllegalArgumentException ex) {
      throw new NotAuthorizedException("Invalid token", ex);
    }
  }

  @Transactional
  public UserPreferencesResponse getUserPreferences(String userId) {
    var user = (UserEntity) UserEntity.findById(userId);
    if (user == null) {
      throw new NotAuthorizedException("User no longer exists");
    }
    return new UserPreferencesResponse(ThemeCatalog.normalize(user.theme), user.timezone);
  }

  @Transactional
  public UserPreferencesResponse updateUserPreferences(String userId, UpdatePreferencesRequest request) {
    var user = (UserEntity) UserEntity.findById(userId);
    if (user == null) {
      throw new NotAuthorizedException("User no longer exists");
    }
    user.theme = ThemeCatalog.normalize(request.theme());
    if (request.timezone() != null) {
      user.timezone = request.timezone().isBlank() ? null : request.timezone();
    }
    return new UserPreferencesResponse(user.theme, user.timezone);
  }

  @Transactional
  public String createOAuthAuthorizationUrl(String returnTo) {
    var state = AuthSupport.randomToken(16);
    var payload = new OAuthStateEntity();
    payload.state = state;
    payload.returnTo = normalizeReturnTo(returnTo);
    payload.setExpiry(Instant.now().plusSeconds(600));
    payload.persist();

    return googleOAuthClient.buildAuthorizationUrl(state, getOAuthCallbackUrl());
  }

  @Transactional
  public String handleOAuthCallback(String code, String state) {
    validateOAuthCallbackInput(code, state);
    var stateEntity = consumeOAuthState(state);
    var email = googleOAuthClient.exchangeCodeForEmail(code, getOAuthCallbackUrl());
    var user = findOrCreateUser(email);
    var session = issueTokenPair(user);
    return buildOAuthCallbackRedirect(stateEntity.returnTo, session, email);
  }

  private TokenResponse issueTokenPair(UserEntity user) {
    var accessToken = jwtUtil.createAccessToken(user.id, user.email, accessTokenTtlSeconds);
    var refreshToken = createRefreshToken(user.id);
    return new TokenResponse(accessToken, refreshToken, accessTokenTtlSeconds, "Bearer");
  }

  private String createRefreshToken(String userId) {
    var token = AuthSupport.randomToken(32);
    return refreshTokenService.create(token, userId, refreshTokenDays);
  }

  private void validateOAuthCallbackInput(String code, String state) {
    if (code == null || code.isBlank() || state == null || state.isBlank()) {
      throw new BadRequestException("Missing OAuth callback parameters");
    }
  }

  private OAuthStateEntity consumeOAuthState(String state) {
    var stateEntity = (OAuthStateEntity) OAuthStateEntity.findById(state);
    OAuthStateEntity.deleteById(state);
    if (stateEntity == null || stateEntity.isExpiredAt(Instant.now())) {
      throw new NotAuthorizedException("Invalid or expired OAuth state");
    }
    return stateEntity;
  }

  private UserEntity findOrCreateUser(String email) {
    var user = (UserEntity) UserEntity.find("email", email).firstResult();
    if (user != null) {
      return user;
    }

    var createdUser = new UserEntity();
    createdUser.email = email;
    createdUser.persist();
    return createdUser;
  }

  private String buildOAuthCallbackRedirect(
      String returnTo,
      TokenResponse session,
      String email
  ) {
    return returnTo + "/auth/callback"
        + "?accessToken=" + AuthSupport.urlEncode(session.accessToken())
        + "&refreshToken=" + AuthSupport.urlEncode(session.refreshToken())
        + "&expiresIn=" + session.expiresIn()
        + "&email=" + AuthSupport.urlEncode(email);
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
    } catch (IllegalArgumentException ex) {
      return oauthDefaultReturnTo;
    }
  }

  private String getOAuthCallbackUrl() {
    return apiPublicUrl + "/auth/google/callback";
  }
}
