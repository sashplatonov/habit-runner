package com.sashplatonov.habbit.runner.support;

import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.auth.RefreshTokenService;

public class RecordingRefreshTokenService extends RefreshTokenService {
  private RefreshTokenEntity requireActiveResult;
  private String revokedToken;
  private String createdToken;
  private String createdUserId;
  private int createdDays;

  public void setRequireActiveResult(RefreshTokenEntity result) {
    this.requireActiveResult = result;
  }

  public String getRevokedToken() {
    return revokedToken;
  }

  public String getCreatedToken() {
    return createdToken;
  }

  public String getCreatedUserId() {
    return createdUserId;
  }

  public int getCreatedDays() {
    return createdDays;
  }

  @Override
  public RefreshTokenEntity requireActive(String token) {
    return requireActiveResult;
  }

  @Override
  public void revoke(String token) {
    revokedToken = token;
  }

  @Override
  public String create(String token, String userId, int refreshTokenDays) {
    createdToken = token;
    createdUserId = userId;
    createdDays = refreshTokenDays;
    return "created-refresh";
  }
}
