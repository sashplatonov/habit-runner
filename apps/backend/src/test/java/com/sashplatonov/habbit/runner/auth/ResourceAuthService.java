package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;

public class ResourceAuthService extends AuthService {
  private String lastLoginEmail;
  private String lastRefreshToken;
  private String lastReturnTo;
  private String lastCode;
  private String lastState;
  private String revokedToken;
  private TokenResponse loginResponse;
  private TokenResponse refreshResponse;
  private String googleStartRedirect;
  private OAuthCallbackSession googleCallbackRedirect;

  public ResourceAuthService() {
    super(TestConfigFactory.defaultAuthConfig(), new AuthCollaborators(null, null, null, null));
  }

  public void setLoginResponse(TokenResponse loginResponse) {
    this.loginResponse = loginResponse;
  }

  public void setRefreshResponse(TokenResponse refreshResponse) {
    this.refreshResponse = refreshResponse;
  }

  public void setGoogleStartRedirect(String googleStartRedirect) {
    this.googleStartRedirect = googleStartRedirect;
  }

  public void setGoogleCallbackRedirect(OAuthCallbackSession googleCallbackRedirect) {
    this.googleCallbackRedirect = googleCallbackRedirect;
  }

  public String getLastLoginEmail() {
    return lastLoginEmail;
  }

  public String getLastRefreshToken() {
    return lastRefreshToken;
  }

  public String getLastReturnTo() {
    return lastReturnTo;
  }

  public String getLastCode() {
    return lastCode;
  }

  public String getLastState() {
    return lastState;
  }

  public String getRevokedToken() {
    return revokedToken;
  }

  @Override
  public TokenResponse login(String email) {
    lastLoginEmail = email;
    return loginResponse;
  }

  @Override
  public String createOAuthAuthorizationUrl(String returnTo) {
    lastReturnTo = returnTo;
    return googleStartRedirect;
  }

  @Override
  public OAuthCallbackSession handleOAuthCallbackSession(String code, String state) {
    lastCode = code;
    lastState = state;
    return googleCallbackRedirect;
  }

  @Override
  public TokenResponse refreshToken(String token) {
    lastRefreshToken = token;
    return refreshResponse;
  }

  @Override
  public void revokeToken(String token) {
    revokedToken = token;
  }

  @Override
  public CurrentUser verifyAccessToken(String token) {
    return new CurrentUser("user-1", "user@example.test");
  }
}
