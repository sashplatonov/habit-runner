package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.access.OAuthStateAccess;
import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import com.sashplatonov.habbit.runner.auth.identity.IdentityService;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.JwtUtil;
import com.sashplatonov.habbit.runner.auth.support.OAuthCallbackSession;
import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;
import com.sashplatonov.habbit.runner.auth.support.AuthSupport;
import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitService;
import com.sashplatonov.habbit.runner.auth.support.RefreshedSession;
import com.sashplatonov.habbit.runner.auth.telegram.TelegramWebAppUser;
import com.sashplatonov.habbit.runner.auth.support.RefreshTokenRejectedException;
import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.infrastructure.http.TraceContextSupport;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetric;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetricsInstrumentation;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
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
  protected final JwtUtil jwtUtil;
  protected final RefreshTokenService refreshTokenService;
  protected final UserService userService;
  protected final OAuthSupport oauthSupport;
  protected final IdentityService identityService;
  protected final OAuthStateAccess oauthStateAccess;
  protected final AuthRateLimitService authRateLimitService;
  protected final ServiceMetricsInstrumentation serviceMetricsInstrumentation;
  protected OAuthAccountLinkService oauthAccountLinkService;

  @Inject
  public AuthService(
      AuthConfig authConfig,
      JwtUtil jwtUtil,
      RefreshTokenService refreshTokenService,
      UserService userService,
      OAuthSupport oauthSupport,
      IdentityService identityService,
      OAuthStateAccess oauthStateAccess,
      AuthRateLimitService authRateLimitService,
      ServiceMetricsInstrumentation serviceMetricsInstrumentation,
      OAuthAccountLinkService oauthAccountLinkService
  ) {
    this.authConfig = authConfig;
    this.jwtUtil = jwtUtil;
    this.refreshTokenService = refreshTokenService;
    this.userService = userService;
    this.oauthSupport = oauthSupport;
    this.identityService = identityService;
    this.oauthStateAccess = oauthStateAccess;
    this.authRateLimitService = authRateLimitService;
    this.serviceMetricsInstrumentation = serviceMetricsInstrumentation;
    this.oauthAccountLinkService = oauthAccountLinkService;
  }

  @Transactional
  public RefreshedSession refreshToken(String token) {
    var record = refreshTokenService.requireActive(token);
    authRateLimitService.checkAccount(
        "auth:refresh",
        record.getFamilyId(),
        10,
        Duration.ofMinutes(10)
    );
    var user = userService.findRequiredUserById(record.getUserId());
    if (user == null) {
      log.warn(
          "Refresh token rejected: userId={}, traceId={}, reason=user-not-found",
          record.getUserId(),
          TraceContextSupport.traceIdOrUnknown()
      );
      throw new RefreshTokenRejectedException();
    }
    var accessToken = jwtUtil.createAccessToken(user.getId(), user.getEmail(), authConfig.accessTokenTtlSeconds());
    var refreshToken = refreshTokenService.rotate(record, authConfig.refreshTokenDays());
    log.info(
        "Access token refreshed: userId={}, authMethod=refresh-token, traceId={}",
        record.getUserId(),
        TraceContextSupport.traceIdOrUnknown()
    );
    serviceMetricsInstrumentation.record(ServiceMetric.AUTH_REFRESH_SUCCESS);
    return new RefreshedSession(
        accessToken,
        refreshToken,
        authConfig.accessTokenTtlSeconds(),
        new CurrentUser(user.getId(), user.getEmail())
    );
  }

  @Transactional
  public TokenResponse authenticateTelegram(TelegramWebAppUser telegramUser) {
    if (telegramUser == null || telegramUser.id() <= 0) {
      throw new BadRequestException("Invalid Telegram user");
    }
    var displayName = telegramUser.username() == null || telegramUser.username().isBlank()
        ? null : "@" + telegramUser.username();
    var resolution = identityService.resolveTelegram(Long.toString(telegramUser.id()), displayName);
    var user = userService.findRequiredUserById(resolution.userId());
    var session = issueTokenPair(user, authConfig.accessTokenTtlSeconds(), authConfig.refreshTokenDays());
    authRateLimitService.checkAccount("auth:telegram:session", Long.toString(telegramUser.id()), 10, Duration.ofMinutes(10));
    serviceMetricsInstrumentation.record(ServiceMetric.AUTH_LOGIN_SUCCESS_GOOGLE);
    return new TokenResponse(session.accessToken(), session.refreshToken(), session.expiresIn(),
        session.tokenType(), resolution.existingAccount());
  }

  @Transactional
  public void revokeToken(String token) {
    refreshTokenService.revoke(token);
  }

  @Transactional
  public TokenResponse issueSessionForUserId(String userId) {
    var user = userService.findRequiredUserById(userId);
    if (user == null) {
      throw new NotAuthorizedException("Linked account no longer exists");
    }
    return issueTokenPair(user, authConfig.accessTokenTtlSeconds(), authConfig.refreshTokenDays());
  }

  public CurrentUser verifyAccessToken(String token) {
    try {
      return jwtUtil.verify(token);
    } catch (IllegalArgumentException ex) {
      throw new NotAuthorizedException("Invalid token", ex);
    }
  }

  @Transactional
  public String createOAuthAuthorizationUrl(String returnTo) {
    return createOAuthAuthorizationUrl(returnTo, null);
  }

  @Transactional
  public String createGoogleLinkAuthorizationUrl(String ownerUserId, String returnTo) {
    if (ownerUserId == null || ownerUserId.isBlank()) {
      throw new NotAuthorizedException("Authentication required");
    }
    return createOAuthAuthorizationUrl(returnTo, ownerUserId);
  }

  private String createOAuthAuthorizationUrl(String returnTo, String linkUserId) {
    var state = AuthSupport.randomToken(16);
    var payload = new OAuthStateEntity();
    payload.state = state;
    payload.returnTo = oauthSupport.normalizeReturnTo(returnTo);
    payload.setLinkUserId(linkUserId);
    payload.setExpiry(now().plusSeconds(600));
    oauthStateAccess.save(payload);
    return oauthSupport.buildAuthorizationUrl(state);
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
    var email = oauthSupport.exchangeCodeForEmail(code);
    authRateLimitService.checkAccount(
        "auth:google:callback",
        email,
        10,
        Duration.ofMinutes(10)
    );
    var googleUser = userService.findOrCreateUser(email);
    var user = oauthAccountLinkService.resolve(googleUser, email, stateEntity.linkUserId());
    var session = issueTokenPair(user, authConfig.accessTokenTtlSeconds(), authConfig.refreshTokenDays());
    log.info(
        "OAuth login succeeded: userId={}, provider=google, traceId={}",
        user.getId(),
        TraceContextSupport.traceIdOrUnknown()
    );
    serviceMetricsInstrumentation.record(ServiceMetric.AUTH_LOGIN_SUCCESS_GOOGLE);
    return new OAuthCallbackSession(oauthSupport.buildCallbackRedirect(stateEntity.returnTo), session);
  }

  private TokenResponse issueTokenPair(UserEntity user, int accessTtlSeconds, int refreshDays) {
    var access = jwtUtil.createAccessToken(user.getId(), user.getEmail(), accessTtlSeconds);
    var refresh = refreshTokenService.create(AuthSupport.randomToken(32), user.getId(), refreshDays);
    return new TokenResponse(access, refresh, accessTtlSeconds, "Bearer");
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
