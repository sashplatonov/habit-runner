package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.access.OAuthStateAccess;
import com.sashplatonov.habbit.runner.auth.access.UserAccess;
import com.sashplatonov.habbit.runner.auth.client.GoogleOAuthClient;
import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import com.sashplatonov.habbit.runner.auth.resource.AuthResource;
import com.sashplatonov.habbit.runner.auth.resource.AuthThemeResource;
import com.sashplatonov.habbit.runner.auth.security.AuthGuardFilter;
import com.sashplatonov.habbit.runner.auth.security.BearerTokenExtractor;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.CsrfGuardFilter;
import com.sashplatonov.habbit.runner.auth.security.JwtUtil;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.auth.service.AuthService;
import com.sashplatonov.habbit.runner.auth.service.PreferencesService;
import com.sashplatonov.habbit.runner.auth.service.RefreshTokenService;
import com.sashplatonov.habbit.runner.auth.service.UserService;
import com.sashplatonov.habbit.runner.auth.support.AuthCollaborators;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthSupport;
import com.sashplatonov.habbit.runner.auth.support.OAuthCallbackSession;
import com.sashplatonov.habbit.runner.auth.support.OAuthHelper;
import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;
import com.sashplatonov.habbit.runner.auth.support.ThemeCatalog;
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
