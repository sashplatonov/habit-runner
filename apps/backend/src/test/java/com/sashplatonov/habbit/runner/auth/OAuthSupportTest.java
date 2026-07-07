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
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OAuthSupportTest {

  @Test
  void shouldDelegateAuthorizationUrlWhenOAuthSupportBuildsAuthorizationUrl() {
    var helper = new RecordingOAuthHelper();
    var client = new RecordingGoogleOAuthClient();
    var support = new OAuthSupport(client, helper);

    var authorizationUrl = support.buildAuthorizationUrl("state-123");

    assertEquals("https://accounts.example.test/auth?state=state-123", authorizationUrl);
    assertEquals("state-123", client.getLastState());
    assertEquals("https://api.example.test/auth/google/callback", client.getLastCallbackUrl());
  }

  @Test
  void shouldDelegateCodeExchangeWhenOAuthSupportExchangesCode() {
    var helper = new RecordingOAuthHelper();
    var client = new RecordingGoogleOAuthClient();
    var support = new OAuthSupport(client, helper);

    var email = support.exchangeCodeForEmail("oauth-code");

    assertEquals("oauth@example.test", email);
    assertEquals("oauth-code", client.getLastCode());
    assertEquals("https://api.example.test/auth/google/callback", client.getLastCallbackUrl());
  }

  @Test
  void shouldDelegateReturnToNormalizationAndCallbackRedirectWhenOAuthSupportUsesHelper() {
    var helper = new RecordingOAuthHelper();
    var support = new OAuthSupport(new RecordingGoogleOAuthClient(), helper);

    var normalized = support.normalizeReturnTo("https://client.example.test/path");
    var redirect = support.buildCallbackRedirect("https://client.example.test");
    var callbackUrl = support.getCallbackUrl();

    assertEquals("https://client.example.test", normalized);
    assertEquals("https://client.example.test/auth/callback?ok=true", redirect);
    assertEquals("https://api.example.test/auth/google/callback", callbackUrl);
    assertEquals("https://client.example.test/path", helper.getLastReturnTo());
    assertEquals("https://client.example.test", helper.getLastRedirectBase());
  }
}
