package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitService;
import com.sashplatonov.habbit.runner.auth.support.RefreshedSession;
import com.sashplatonov.habbit.runner.auth.support.RefreshTokenRejectedException;
import com.sashplatonov.habbit.runner.infrastructure.http.TraceContextSupport;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;

@ApplicationScoped
@Slf4j
public class RefreshSessionService {
  private final RefreshTokenService refreshTokenService;
  private final UserService userService;
  private final TokenIssuer tokenIssuer;
  private final AuthRateLimitService authRateLimitService;

  @Inject
  public RefreshSessionService(
      RefreshTokenService refreshTokenService,
      UserService userService,
      TokenIssuer tokenIssuer,
      AuthRateLimitService authRateLimitService
  ) {
    this.refreshTokenService = refreshTokenService;
    this.userService = userService;
    this.tokenIssuer = tokenIssuer;
    this.authRateLimitService = authRateLimitService;
  }

  @Transactional
  public RefreshedSession refresh(String token) {
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
    var accessToken = tokenIssuer.issueAccessToken(user);
    var refreshToken = refreshTokenService.rotate(record, tokenIssuer.refreshTokenDays());
    log.info(
        "Access token refreshed: userId={}, authMethod=refresh-token, traceId={}",
        record.getUserId(),
        TraceContextSupport.traceIdOrUnknown()
    );
    return new RefreshedSession(
        accessToken,
        refreshToken,
        tokenIssuer.accessTokenTtlSeconds(),
        new CurrentUser(user.getId(), user.getEmail())
    );
  }

  @Transactional
  public void revoke(String token) {
    refreshTokenService.revoke(token);
  }
}
