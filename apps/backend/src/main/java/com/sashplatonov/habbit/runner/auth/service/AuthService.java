package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.access.OAuthStateAccess;
import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.support.AuthCollaborators;
import com.sashplatonov.habbit.runner.auth.support.OAuthCallbackSession;
import com.sashplatonov.habbit.runner.auth.support.AuthSupport;
import com.sashplatonov.habbit.runner.auth.support.AuthServiceSupport;
import com.sashplatonov.habbit.runner.auth.support.RefreshTokenRejectedException;
import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.infrastructure.http.TraceContextSupport;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetric;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.time.Duration;

@ApplicationScoped
@Slf4j
public class AuthService {

  protected final AuthConfig authConfig;
  protected final AuthCollaborators collaborators;
  protected final OAuthStateAccess oauthStateAccess;
  protected final AuthServiceSupport authServiceSupport;

  protected AuthService(AuthConfig authConfig, AuthCollaborators collaborators) {
    this(authConfig, collaborators, null, (AuthServiceSupport) null);
  }

  @Inject
  public AuthService(
      AuthConfig authConfig,
      AuthCollaborators collaborators,
      OAuthStateAccess oauthStateAccess,
      AuthServiceSupport authServiceSupport
  ) {
    this.authConfig = authConfig;
    this.collaborators = collaborators;
    this.oauthStateAccess = oauthStateAccess;
    this.authServiceSupport = authServiceSupport;
  }

  @Transactional
  public TokenResponse refreshToken(String token) {
    var record = collaborators.requireActiveRefreshToken(token);
    if (authServiceSupport != null) {
      authServiceSupport.checkAccountRateLimit(
          "auth:refresh",
          record.getFamilyId(),
          10,
          Duration.ofMinutes(10)
      );
    }
    var user = collaborators.findRequiredUserById(record.getUserId());
    if (user == null) {
      log.warn(
          "Refresh token rejected: userId={}, traceId={}, reason=user-not-found",
          record.getUserId(),
          TraceContextSupport.traceIdOrUnknown()
      );
      throw new RefreshTokenRejectedException();
    }
    var accessToken = collaborators.createAccessToken(user.getId(), user.getEmail(), authConfig.accessTokenTtlSeconds());
    var refreshToken = collaborators.rotateRefreshToken(record, authConfig.refreshTokenDays());
    log.info(
        "Access token refreshed: userId={}, authMethod=refresh-token, traceId={}",
        record.getUserId(),
        TraceContextSupport.traceIdOrUnknown()
    );
    if (authServiceSupport != null) {
      authServiceSupport.record(ServiceMetric.AUTH_REFRESH_SUCCESS);
    }
    return new TokenResponse(accessToken, refreshToken, authConfig.accessTokenTtlSeconds(), "Bearer");
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
    oauthStateAccess.save(payload);
    return collaborators.buildAuthorizationUrl(state);
  }

  @Transactional
  public String handleOAuthCallback(String code, String state) {
    return handleOAuthCallbackSession(code, state).redirectUrl();
  }

  @Transactional
  public OAuthCallbackSession handleOAuthCallbackSession(String code, String state) {
    validateOAuthCallbackInput(code, state);
    var stateEntity = oauthStateAccess.consume(state);
    if (stateEntity == null || stateEntity.isExpiredAt(now())) {
      log.warn(
          "event=oauth_callback_failed, provider=google, traceId={}, reason=invalid-or-expired-state",
          TraceContextSupport.traceIdOrUnknown()
      );
      throw new NotAuthorizedException("Invalid or expired OAuth state");
    }
    var email = collaborators.exchangeCodeForEmail(code);
    if (authServiceSupport != null) {
      authServiceSupport.checkAccountRateLimit(
          "auth:google:callback",
          email,
          10,
          Duration.ofMinutes(10)
      );
    }
    var user = collaborators.findOrCreateUser(email);
    var session = collaborators.issueTokenPair(user, authConfig.accessTokenTtlSeconds(), authConfig.refreshTokenDays());
    log.info(
        "OAuth login succeeded: userId={}, provider=google, traceId={}",
        user.getId(),
        TraceContextSupport.traceIdOrUnknown()
    );
    if (authServiceSupport != null) {
      authServiceSupport.record(ServiceMetric.AUTH_LOGIN_SUCCESS_GOOGLE);
    }
    return new OAuthCallbackSession(collaborators.buildCallbackRedirect(stateEntity.returnTo), session);
  }

  public int refreshTokenDays() {
    return authConfig.refreshTokenDays();
  }

  private void validateOAuthCallbackInput(String code, String state) {
    if (code == null || code.isBlank() || state == null || state.isBlank()) {
      log.warn(
          "OAuth callback rejected: provider=google, traceId={}, reason=missing-parameters",
          TraceContextSupport.traceIdOrUnknown()
      );
      throw new BadRequestException("Missing OAuth callback parameters");
    }
  }

  protected Instant now() {
    return Instant.now();
  }

}
