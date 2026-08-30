package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.service.RefreshTokenService;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;

final class TestAuthRefreshTokenService extends RefreshTokenService {
  private RefreshTokenEntity activeRefreshToken;
  private String revokedToken;
  private String rotatedRefreshToken = "rotated-refresh";

  void setActiveRefreshToken(RefreshTokenEntity activeRefreshToken) {
    this.activeRefreshToken = activeRefreshToken;
  }

  String getRevokedToken() {
    return revokedToken;
  }

  void setRotatedRefreshToken(String rotatedRefreshToken) {
    this.rotatedRefreshToken = rotatedRefreshToken;
  }

  @Override
  public RefreshTokenEntity requireActive(String token) {
    return activeRefreshToken;
  }

  @Override
  public void revoke(String token) {
    revokedToken = token;
  }

  @Override
  public String create(String token, String userId, int refreshTokenDays) {
    return "refresh::" + userId + "::" + refreshTokenDays;
  }

  @Override
  public String rotate(RefreshTokenEntity activeToken, int refreshTokenDays) {
    return rotatedRefreshToken;
  }
}
