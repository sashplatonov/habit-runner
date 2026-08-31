package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.JwtUtil;
import com.sashplatonov.habbit.runner.auth.support.AuthSupport;
import com.sashplatonov.habbit.runner.auth.support.AuthenticatedSession;
import com.sashplatonov.habbit.runner.model.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotAuthorizedException;

@ApplicationScoped
public class TokenIssuer {
  private final JwtUtil jwtUtil;
  private final RefreshTokenService refreshTokenService;
  private final AuthConfig authConfig;
  private final UserService userService;

  @Inject
  public TokenIssuer(
      JwtUtil jwtUtil,
      RefreshTokenService refreshTokenService,
      AuthConfig authConfig,
      UserService userService
  ) {
    this.jwtUtil = jwtUtil;
    this.refreshTokenService = refreshTokenService;
    this.authConfig = authConfig;
    this.userService = userService;
  }

  public AuthenticatedSession issue(UserEntity user) {
    var token = new TokenResponse(
        issueAccessToken(user),
        refreshTokenService.create(AuthSupport.randomToken(32), user.getId(), authConfig.refreshTokenDays()),
        authConfig.accessTokenTtlSeconds(),
        "Bearer"
    );
    return new AuthenticatedSession(token, new CurrentUser(user.getId(), user.getEmail()));
  }

  @Transactional
  public AuthenticatedSession issueForUserId(String userId) {
    var user = userService.findRequiredUserById(userId);
    if (user == null) {
      throw new NotAuthorizedException("Linked account no longer exists");
    }
    return issue(user);
  }

  public String issueAccessToken(UserEntity user) {
    return jwtUtil.createAccessToken(user.getId(), user.getEmail(), authConfig.accessTokenTtlSeconds());
  }

  public int refreshTokenDays() {
    return authConfig.refreshTokenDays();
  }

  public int accessTokenTtlSeconds() {
    return authConfig.accessTokenTtlSeconds();
  }
}
