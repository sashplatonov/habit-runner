package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;

@ApplicationScoped
@Slf4j
public class AuthService {

  protected final AuthConfig authConfig;
  protected final AuthCollaborators collaborators;
  protected final UserAccess userAccess;
  protected final OAuthStateAccess oauthStateAccess;

  protected interface UserAccess {
    UserEntity findByEmail(String email);
    UserEntity findRequiredById(String userId);
  }

  protected interface OAuthStateAccess {
    OAuthStateEntity consume(String state);
    void save(OAuthStateEntity payload);
  }

  AuthService() {
    this(null, null, null, null);
  }

  protected AuthService(AuthConfig authConfig, AuthCollaborators collaborators) {
    this(authConfig, collaborators, null, null);
  }

  @Inject
  public AuthService(
      AuthConfig authConfig,
      AuthCollaborators collaborators,
      UserAccess userAccess,
      OAuthStateAccess oauthStateAccess
  ) {
    this.authConfig = authConfig;
    this.collaborators = collaborators;
    this.userAccess = userAccess;
    this.oauthStateAccess = oauthStateAccess;
  }

  @Transactional
  public TokenResponse login(String email) {
    var user = userAccess().findByEmail(email);
    if (user == null) {
      log.warn("Login rejected: authMethod=email, reason=unknown-user");
      throw new NotAuthorizedException("Unknown user");
    }
    var session = issueTokenPair(user);
    log.info("Login succeeded: userId={}, authMethod=email", user.getId());
    return session;
  }

  @Transactional
  public TokenResponse refreshToken(String token) {
    var record = collaborators.requireActiveRefreshToken(token);
    var user = requireUserById(record.userId);
    var accessToken = collaborators.createAccessToken(user.getId(), user.email, authConfig.accessTokenTtlSeconds());
    log.info("Access token refreshed: userId={}, authMethod=refresh-token", record.userId);
    return new TokenResponse(accessToken, record.token, authConfig.accessTokenTtlSeconds(), "Bearer");
  }

  @Transactional
  public void revokeToken(String token) {
    collaborators.revokeRefreshToken(token);
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
    payload.setExpiry(now().plusSeconds(600));
    oauthStateAccess().save(payload);
    return collaborators.buildAuthorizationUrl(state);
  }

  @Transactional
  public String handleOAuthCallback(String code, String state) {
    return handleOAuthCallbackSession(code, state).redirectUrl();
  }

  @Transactional
  public OAuthCallbackSession handleOAuthCallbackSession(String code, String state) {
    validateOAuthCallbackInput(code, state);
    var stateEntity = oauthStateAccess().consume(state);
    if (stateEntity == null || stateEntity.isExpiredAt(now())) {
      log.warn("event=oauth_callback_failed, provider=google, reason=invalid-or-expired-state");
      throw new NotAuthorizedException("Invalid or expired OAuth state");
    }
    var email = collaborators.exchangeCodeForEmail(code);
    var user = collaborators.findOrCreateUser(email);
    var session = collaborators.issueTokenPair(user, authConfig.accessTokenTtlSeconds(), authConfig.refreshTokenDays());
    log.info("OAuth login succeeded: userId={}, provider=google", user.getId());
    return new OAuthCallbackSession(collaborators.buildCallbackRedirect(stateEntity.returnTo), session);
  }

  public int refreshTokenDays() {
    return authConfig.refreshTokenDays();
  }

  private TokenResponse issueTokenPair(UserEntity user) {
    var accessToken = collaborators.createAccessToken(user.getId(), user.email, authConfig.accessTokenTtlSeconds());
    var refreshToken = collaborators.createRefreshToken(
        AuthSupport.randomToken(32),
        user.getId(),
        authConfig.refreshTokenDays()
    );
    return new TokenResponse(accessToken, refreshToken, authConfig.accessTokenTtlSeconds(), "Bearer");
  }

  private void validateOAuthCallbackInput(String code, String state) {
    if (code == null || code.isBlank() || state == null || state.isBlank()) {
      log.warn("OAuth callback rejected: provider=google, reason=missing-parameters");
      throw new BadRequestException("Missing OAuth callback parameters");
    }
  }

  protected UserEntity requireUserById(String userId) {
    var user = userAccess().findRequiredById(userId);
    if (user == null) {
      log.warn("Refresh token rejected: userId={}, reason=user-not-found", userId);
      throw new NotAuthorizedException("User no longer exists");
    }
    return user;
  }

  protected UserAccess userAccess() {
    return userAccess;
  }

  protected OAuthStateAccess oauthStateAccess() {
    return oauthStateAccess;
  }

  protected Instant now() {
    return Instant.now();
  }

  public record OAuthCallbackSession(String redirectUrl, TokenResponse session) {
  }
}
