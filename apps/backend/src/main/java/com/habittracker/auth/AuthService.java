package com.habittracker.auth;

import com.habittracker.auth.dto.TokenResponse;
import com.habittracker.model.OAuthStateEntity;
import com.habittracker.model.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;

@ApplicationScoped
@Slf4j
public class AuthService {

  private final AuthConfig authConfig;
  private final AuthCollaborators collaborators;

  public AuthService(
      AuthConfig authConfig,
      AuthCollaborators collaborators
  ) {
    this.authConfig = authConfig;
    this.collaborators = collaborators;
  }

  @Transactional
  public TokenResponse login(String email) {
    var user = findUserByEmail(email);
    if (user == null) {
      log.warn("Login rejected for unknown user: email={}", email);
      throw new NotAuthorizedException("Unknown user");
    }
    log.debug("Login issued tokens: userId={}", user.id);
    return issueTokenPair(user);
  }

  @Transactional
  public TokenResponse refreshToken(String token) {
    var record = collaborators.requireActiveRefreshToken(token);
    var user = requireUserById(record.userId);
    log.debug("Refresh token accepted for userId={}", record.userId);
    var accessToken = collaborators.createAccessToken(user.id, user.email, authConfig.accessTokenTtlSeconds());
    return new TokenResponse(accessToken, record.token, authConfig.accessTokenTtlSeconds(), "Bearer");
  }

  @Transactional
  public void revokeToken(String token) {
    collaborators.revokeRefreshToken(token);
    log.debug("Refresh token revoked");
  }

  public CurrentUser verifyAccessToken(String token) {
    try {
      return collaborators.verifyToken(token);
    } catch (IllegalArgumentException ex) {
      throw new NotAuthorizedException("Invalid token", ex);
    }
  }

  @Transactional
  public String createOAuthAuthorizationUrl(String returnTo) {
    var state = AuthSupport.randomToken(16);
    var payload = new OAuthStateEntity();
    payload.state = state;
    payload.returnTo = collaborators.normalizeReturnTo(returnTo);
    payload.setExpiry(Instant.now().plusSeconds(600));
    payload.persist();
    log.debug("Created OAuth authorization URL: returnTo={}", payload.returnTo);
    return collaborators.buildAuthorizationUrl(state);
  }

  @Transactional
  public String handleOAuthCallback(String code, String state) {
    validateOAuthCallbackInput(code, state);
    var stateEntity = consumeOAuthState(state);
    var email = collaborators.exchangeCodeForEmail(code);
    var user = collaborators.findOrCreateUser(email);
    var session = collaborators.issueTokenPair(user, authConfig.accessTokenTtlSeconds(), authConfig.refreshTokenDays());
    return collaborators.buildCallbackRedirect(stateEntity.returnTo, session, email);
  }

  private TokenResponse issueTokenPair(UserEntity user) {
    var accessToken = collaborators.createAccessToken(user.id, user.email, authConfig.accessTokenTtlSeconds());
    var refreshToken = createRefreshToken(user.id);
    return new TokenResponse(accessToken, refreshToken, authConfig.accessTokenTtlSeconds(), "Bearer");
  }

  private String createRefreshToken(String userId) {
    var token = AuthSupport.randomToken(32);
    return collaborators.createRefreshToken(token, userId, authConfig.refreshTokenDays());
  }

  private void validateOAuthCallbackInput(String code, String state) {
    if (code == null || code.isBlank() || state == null || state.isBlank()) {
      throw new BadRequestException("Missing OAuth callback parameters");
    }
  }

  private OAuthStateEntity consumeOAuthState(String state) {
    var stateEntity = OAuthStateEntity.<OAuthStateEntity>findById(state);
    OAuthStateEntity.deleteById(state);
    if (stateEntity == null || stateEntity.isExpiredAt(Instant.now())) {
      throw new NotAuthorizedException("Invalid or expired OAuth state");
    }
    return stateEntity;
  }

  private UserEntity findUserByEmail(String email) {
    return UserEntity.<UserEntity>find("email", email).firstResult();
  }

  private UserEntity requireUserById(String userId) {
    var user = UserEntity.<UserEntity>findById(userId);
    if (user == null) {
      throw new NotAuthorizedException("User no longer exists");
    }
    return user;
  }

  
}
