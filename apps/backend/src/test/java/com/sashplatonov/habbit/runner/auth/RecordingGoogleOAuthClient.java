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
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;

public final class RecordingGoogleOAuthClient extends GoogleOAuthClient {
  private String lastState;
  private String lastCallbackUrl;
  private String lastCode;

  public RecordingGoogleOAuthClient() {
    super(TestConfigFactory.defaultAuthConfig(), new ObjectMapper());
  }

  public String getLastState() {
    return lastState;
  }

  public String getLastCallbackUrl() {
    return lastCallbackUrl;
  }

  public String getLastCode() {
    return lastCode;
  }

  @Override
  public String buildAuthorizationUrl(String state, String callbackUrl) {
    lastState = state;
    lastCallbackUrl = callbackUrl;
    return "https://accounts.example.test/auth?state=" + state;
  }

  @Override
  public String exchangeCodeForEmail(String code, String callbackUrl) {
    lastCode = code;
    lastCallbackUrl = callbackUrl;
    return "oauth@example.test";
  }
}
