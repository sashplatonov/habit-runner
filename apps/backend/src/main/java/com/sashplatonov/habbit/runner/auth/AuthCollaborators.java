package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class AuthCollaborators {
  private final JwtUtil jwtUtil;

  private final RefreshTokenService refreshTokenService;

  private final OAuthSupport oauthSupport;

  private final UserService userService;

  public AuthCollaborators(
      JwtUtil jwtUtil,
      RefreshTokenService refreshTokenService,
      OAuthSupport oauthSupport,
      UserService userService
  ) {
    this.jwtUtil = jwtUtil;
    this.refreshTokenService = refreshTokenService;
    this.oauthSupport = oauthSupport;
    this.userService = userService;
  }

  public JwtUtil getJwtUtil() {
    return jwtUtil;
  }

  public RefreshTokenService getRefreshTokenService() {
    return refreshTokenService;
  }


  public UserService getUserService() {
    return userService;
  }
  
  public RefreshTokenEntity requireActiveRefreshToken(String token) {
    return refreshTokenService.requireActive(token);
  }

  public void revokeRefreshToken(String token) {
    refreshTokenService.revoke(token);
  }

  public String createRefreshToken(String token, String userId, int days) {
    return refreshTokenService.create(token, userId, days);
  }

  public CurrentUser verifyToken(String token) {
    return jwtUtil.verify(token);
  }

  public String createAccessToken(String userId, String email, int ttlSeconds) {
    return jwtUtil.createAccessToken(userId, email, ttlSeconds);
  }

  public String normalizeReturnTo(String returnTo) {
    return oauthSupport.normalizeReturnTo(returnTo);
  }

  public String buildAuthorizationUrl(String state) {
    return oauthSupport.buildAuthorizationUrl(state);
  }

  public String exchangeCodeForEmail(String code) {
    return oauthSupport.exchangeCodeForEmail(code);
  }

  public UserEntity findOrCreateUser(String email) {
    return userService.findOrCreateUser(email);
  }

  public String buildCallbackRedirect(String returnTo) {
    return oauthSupport.buildCallbackRedirect(returnTo);
  }

  public TokenResponse issueTokenPair(UserEntity user, int accessTtlSeconds, int refreshDays) {
    var access = createAccessToken(user.id, user.email, accessTtlSeconds);
    var refresh = createRefreshToken(AuthSupport.randomToken(32), user.id, refreshDays);
    return new TokenResponse(access, refresh, accessTtlSeconds, "Bearer");
  }
}

