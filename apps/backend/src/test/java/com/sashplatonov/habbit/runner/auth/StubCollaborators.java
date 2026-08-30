package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.support.AuthCollaborators;
import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;

final class StubCollaborators extends AuthCollaborators {
  private RefreshTokenEntity activeRefreshToken;
  private String revokedToken;
  private IllegalArgumentException verifyFailure;
  private String normalizedReturnTo = "/";
  private String exchangedCode;
  private String oauthEmail = "oauth@example.test";
  private UserEntity oauthUser = AuthServiceUnitCoverageTest.user("oauth-user", "oauth@example.test");
  private UserEntity userById;
  private TokenResponse issuedSession = new TokenResponse("access-1", "refresh-1", 3600, "Bearer");
  private String callbackRedirect = "https://app.example.test/callback";
  private String rotatedRefreshToken = "rotated-refresh";

  StubCollaborators() {
    super(null, null, null, null);
  }

  void setActiveRefreshToken(RefreshTokenEntity activeRefreshToken) {
    this.activeRefreshToken = activeRefreshToken;
  }

  String getRevokedToken() {
    return revokedToken;
  }

  void setVerifyFailure(IllegalArgumentException verifyFailure) {
    this.verifyFailure = verifyFailure;
  }

  void setNormalizedReturnTo(String normalizedReturnTo) {
    this.normalizedReturnTo = normalizedReturnTo;
  }

  String getExchangedCode() {
    return exchangedCode;
  }

  void setOauthEmail(String oauthEmail) {
    this.oauthEmail = oauthEmail;
  }

  void setOauthUser(UserEntity oauthUser) {
    this.oauthUser = oauthUser;
  }

  void setUserById(UserEntity userById) {
    this.userById = userById;
  }

  void setIssuedSession(TokenResponse issuedSession) {
    this.issuedSession = issuedSession;
  }

  void setCallbackRedirect(String callbackRedirect) {
    this.callbackRedirect = callbackRedirect;
  }

  void setRotatedRefreshToken(String rotatedRefreshToken) {
    this.rotatedRefreshToken = rotatedRefreshToken;
  }

  @Override
  public RefreshTokenEntity requireActiveRefreshToken(String token) {
    return activeRefreshToken;
  }

  @Override
  public void revokeRefreshToken(String token) {
    revokedToken = token;
  }

  @Override
  public String createRefreshToken(String token, String userId, int days) {
    return "refresh::" + userId + "::" + days;
  }

  @Override
  public String rotateRefreshToken(RefreshTokenEntity token, int days) {
    return rotatedRefreshToken;
  }

  @Override
  public CurrentUser verifyToken(String token) {
    if (verifyFailure != null) {
      throw verifyFailure;
    }
    return new CurrentUser("verified-user", "verified@example.test");
  }

  @Override
  public String createAccessToken(String userId, String email, int ttlSeconds) {
    return "access::" + userId + "::" + email + "::" + ttlSeconds;
  }

  @Override
  public String normalizeReturnTo(String returnTo) {
    return normalizedReturnTo;
  }

  @Override
  public String buildAuthorizationUrl(String state) {
    return "https://accounts.example.test/start?state=" + state;
  }

  @Override
  public String exchangeCodeForEmail(String code) {
    exchangedCode = code;
    return oauthEmail;
  }

  @Override
  public UserEntity findOrCreateUser(String email) {
    return oauthUser;
  }

  @Override
  public UserEntity findRequiredUserById(String userId) {
    return userById;
  }

  @Override
  public TokenResponse issueTokenPair(UserEntity user, int accessTtlSeconds, int refreshDays) {
    return issuedSession;
  }

  @Override
  public String buildCallbackRedirect(String returnTo) {
    return callbackRedirect;
  }
}
