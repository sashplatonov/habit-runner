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
import com.sashplatonov.habbit.runner.auth.dto.OAuthStartQuery;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtAndOAuthHelperTest {

  @Test
  void shouldCreateAndVerifyAccessTokenWhenSecretMatches() {
    var jwtUtil = new JwtUtil(TestConfigFactory.defaultAuthConfig());
    var token = jwtUtil.createAccessToken("user-1", "user@example.test", 300);

    var currentUser = jwtUtil.verify(token);

    assertEquals("user-1", currentUser.id());
    assertEquals("user@example.test", currentUser.email());
  }

  @Test
  void shouldThrowIllegalArgumentExceptionWhenJwtVerificationFails() {
    var issuerConfig = TestConfigFactory.authConfig("different-secret", "habittracker-test");
    var signedToken = new JwtUtil(TestConfigFactory.defaultAuthConfig())
        .createAccessToken("user-1", "user@example.test", 300);

    assertThrows(IllegalArgumentException.class, () -> new JwtUtil(issuerConfig).verify(signedToken));
  }

  @Test
  void shouldFallbackToDefaultReturnToWhenOAuthHelperReceivesBlankValue() {
    var helper = new OAuthHelper(TestConfigFactory.defaultAuthConfig());

    assertEquals("https://app.example.test", helper.normalizeReturnTo(" "));
  }

  @Test
  void shouldFallbackToDefaultReturnToWhenOAuthHelperReceivesUnsupportedScheme() {
    var helper = new OAuthHelper(TestConfigFactory.defaultAuthConfig());

    assertEquals("https://app.example.test", helper.normalizeReturnTo("javascript:alert(1)"));
  }

  @Test
  void shouldFallbackToDefaultReturnToWhenOAuthHelperReceivesMalformedUrl() {
    var helper = new OAuthHelper(TestConfigFactory.defaultAuthConfig());

    assertEquals("https://app.example.test", helper.normalizeReturnTo("http://["));
  }

  @Test
  void shouldReturnOriginWhenOAuthHelperReceivesValidUrl() {
    var helper = new OAuthHelper(TestConfigFactory.defaultAuthConfig());

    assertEquals("https://client.example.test", helper.normalizeReturnTo("https://client.example.test/path?q=1"));
  }

  @Test
  void shouldBuildCallbackRedirectWhenOAuthHelperReceivesReturnTarget() {
    var helper = new OAuthHelper(TestConfigFactory.defaultAuthConfig());

    var redirect = helper.buildCallbackRedirect("https://client.example.test");

    assertEquals("https://client.example.test/auth/callback", redirect);
  }

  @Test
  void shouldReturnConfiguredCallbackUrlWhenOAuthHelperRequested() {
    var helper = new OAuthHelper(TestConfigFactory.defaultAuthConfig());

    assertEquals("https://api.example.test/auth/google/callback", helper.getCallbackUrl());
  }

  @Test
  void shouldReturnPreviewProxyCallbackUrlWhenApiPublicUrlTargetsLocalWebProxy() {
    var helper = new OAuthHelper(TestConfigFactory.authConfig(
        "different-secret",
        "habittracker-local",
        "http://localhost:5137/api",
        "http://localhost:5137"
    ));

    assertEquals("http://localhost:5137/api/auth/google/callback", helper.getCallbackUrl());
  }

  @Test
  void shouldExposeReturnToFromOAuthStartQueryRecord() {
    var query = new OAuthStartQuery("/dashboard");

    assertEquals("/dashboard", query.returnTo());
  }
}