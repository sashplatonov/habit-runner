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
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthCoreUtilityTest {

  @Test
  void shouldExtractTokenWhenAuthorizationHeaderUsesBearerScheme() {
    var token = BearerTokenExtractor.extract("Bearer test-token");

    assertEquals("test-token", token);
  }

  @Test
  void shouldReturnNullWhenAuthorizationHeaderMissing() {
    assertNull(BearerTokenExtractor.extract(null));
    assertNull(BearerTokenExtractor.extract("   "));
  }

  @Test
  void shouldReturnNullWhenAuthorizationHeaderUsesDifferentScheme() {
    assertNull(BearerTokenExtractor.extract("Basic test-token"));
    assertNull(BearerTokenExtractor.extract("Bearer"));
  }

  @Test
  void shouldReturnCurrentUserWhenContextInitialized() {
    var context = new CurrentUserContext();
    var expected = new CurrentUser("user-1", "user@example.test");

    context.setUser(expected);

    assertEquals(expected, context.requireUser());
  }

  @Test
  void shouldThrowUnauthorizedWhenCurrentUserMissing() {
    var context = new CurrentUserContext();

    assertThrows(jakarta.ws.rs.NotAuthorizedException.class, context::requireUser);
  }

  @Test
  void shouldKeepThemeWhenThemeIsSupported() {
    assertEquals("graphite", ThemeCatalog.normalize("graphite"));
    assertEquals("lagoon", ThemeCatalog.normalize("lagoon"));
  }

  @Test
  void shouldFallbackToCloudWhenThemeUnsupported() {
    assertEquals("cloud", ThemeCatalog.normalize("unknown"));
    assertEquals("cloud", ThemeCatalog.normalize(null));
  }

  @Test
  void shouldGenerateHexTokenWhenRandomTokenRequested() {
    var first = AuthSupport.randomToken(16);
    var second = AuthSupport.randomToken(16);

    assertEquals(32, first.length());
    assertEquals(32, second.length());
    assertNotEquals(first, second);
    assertTrue(first.matches("[0-9a-f]+"));
  }

  @Test
  void shouldEncodeReservedCharactersWhenUrlEncodingRequested() {
    var encoded = AuthSupport.urlEncode("a+b test@example.test");

    assertEquals("a%2Bb+test%40example.test", encoded);
  }
}
