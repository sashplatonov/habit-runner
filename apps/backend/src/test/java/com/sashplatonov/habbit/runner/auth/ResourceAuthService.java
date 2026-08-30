package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.service.AuthService;
import com.sashplatonov.habbit.runner.auth.support.AuthCollaborators;
import com.sashplatonov.habbit.runner.auth.support.OAuthCallbackSession;
import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;

public class ResourceAuthService extends AuthService {
  private String lastRefreshToken;
  private String lastReturnTo;
  private String lastCode;
  private String lastState;
  private String revokedToken;
  private TokenResponse refreshResponse;
  private String googleStartRedirect;
  private String googleLinkStartRedirect;
  private OAuthCallbackSession googleCallbackRedirect;

  public ResourceAuthService() {
    super(TestConfigFactory.defaultAuthConfig(), new AuthCollaborators(null, null, null, null));
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

  public void setGoogleLinkStartRedirect(String redirect) {
    googleLinkStartRedirect = redirect;
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

  @Override
  public String createOAuthAuthorizationUrl(String returnTo) {
    lastReturnTo = returnTo;
    return googleStartRedirect;
  }

  @Override
  public String createGoogleLinkAuthorizationUrl(String ownerUserId, String returnTo) {
    lastReturnTo = returnTo;
    return googleLinkStartRedirect;
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

  public String getRevokedToken() {
    return revokedToken;
  }

  @Override
  public CurrentUser verifyAccessToken(String token) {
    return new CurrentUser("user-1", "user@example.test");
  }
}
