package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.repository.OAuthStateRepository;
import com.sashplatonov.habbit.runner.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import lombok.extern.slf4j.Slf4j;

@ApplicationScoped
@Slf4j
public class AuthService extends AuthServiceSupport {

  AuthService() {
    super();
  }

  protected AuthService(AuthConfig authConfig, AuthCollaborators collaborators) {
    this(authConfig, collaborators, null, null);
  }

  @Inject
  public AuthService(
      AuthConfig authConfig,
      AuthCollaborators collaborators,
      UserRepository userRepository,
      OAuthStateRepository oauthStateRepository
  ) {
    super(authConfig, collaborators, userRepository, oauthStateRepository);
  }

  @Transactional
  public TokenResponse login(String email) {
    var user = findUserByEmail(email);
    if (user == null) {
      log.warn("Login rejected: authMethod=email, reason=unknown-user");
      throw new NotAuthorizedException("Unknown user");
    }
    var session = issueTokenPair(user);
    log.info("Login succeeded: userId={}, authMethod=email", user.id);
    return session;
  }

  @Transactional
  public TokenResponse refreshToken(String token) {
    var record = collaborators.requireActiveRefreshToken(token);
    var user = requireUserById(record.userId);
    var accessToken = collaborators.createAccessToken(user.id, user.email, authConfig.accessTokenTtlSeconds());
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
    storeOAuthState(state, collaborators.normalizeReturnTo(returnTo), now().plusSeconds(600));
    return collaborators.buildAuthorizationUrl(state);
  }

  @Transactional
  public String handleOAuthCallback(String code, String state) {
    return handleOAuthCallbackSession(code, state).redirectUrl();
  }

  @Transactional
  public OAuthCallbackSession handleOAuthCallbackSession(String code, String state) {
    validateOAuthCallbackInput(code, state);
    var stateEntity = consumeOAuthState(state);
    var email = collaborators.exchangeCodeForEmail(code);
    var user = collaborators.findOrCreateUser(email);
    var session = collaborators.issueTokenPair(user, authConfig.accessTokenTtlSeconds(), authConfig.refreshTokenDays());
    log.info("OAuth login succeeded: userId={}, provider=google", user.id);
    return new OAuthCallbackSession(collaborators.buildCallbackRedirect(stateEntity.returnTo), session);
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
      log.warn("OAuth callback rejected: provider=google, reason=missing-parameters");
      throw new BadRequestException("Missing OAuth callback parameters");
    }
  }

  protected OAuthStateEntity consumeOAuthState(String state) {
    var stateEntity = findOAuthState(state);
    deleteOAuthState(state);
    if (stateEntity == null || stateEntity.isExpiredAt(now())) {
      log.warn("event=oauth_callback_failed, provider=google, reason=invalid-or-expired-state");
      throw new NotAuthorizedException("Invalid or expired OAuth state");
    }
    return stateEntity;
  }

  protected UserEntity findUserByEmail(String email) {
    return userRepository == null ? null : userRepository.findByEmail(email);
  }

  protected UserEntity requireUserById(String userId) {
    var user = findUserById(userId);
    if (user == null) {
      log.warn("Refresh token rejected: userId={}, reason=user-not-found", userId);
      throw new NotAuthorizedException("User no longer exists");
    }
    return user;
  }

  public record OAuthCallbackSession(String redirectUrl, TokenResponse session) {
  }
}
