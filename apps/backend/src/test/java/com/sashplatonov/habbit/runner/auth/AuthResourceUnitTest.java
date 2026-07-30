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
import com.sashplatonov.habbit.runner.auth.dto.AuthSessionResponse;
import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
// Preference DTOs moved to AuthPreferencesResourceUnitTest
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import com.sashplatonov.habbit.runner.support.TestHelpers;

class AuthResourceUnitTest {

  @Test
  void shouldDelegateAuthEndpointsToAuthService() {
    var authService = new ResourceAuthService();
    authService.setRefreshResponse(new TokenResponse("access-2", "refresh-2", 3600, "Bearer"));
    authService.setGoogleStartRedirect("https://accounts.example.test/start");
    authService.setGoogleCallbackRedirect(new OAuthCallbackSession(
      "https://app.example.test/callback",
      new TokenResponse("access-3", "refresh-3", 3600, "Bearer")
    ));
    var resource = resource(authService, new ResourcePreferencesService(), new CurrentUserContext());

    var googleStart = resource.startGoogle("/dashboard");
    var googleCallback = resource.googleCallback("code-123", "state-123");
    var refresh = resource.refresh("refresh-1", "csrf-1");
    var logout = resource.logout("refresh-1");

    assertEquals("/dashboard", authService.getLastReturnTo());
    assertRedirect(googleStart, "https://accounts.example.test/start");
    assertEquals("code-123", authService.getLastCode());
    assertEquals("state-123", authService.getLastState());
    assertRedirect(googleCallback, "https://app.example.test/callback");
    assertCookiesPresent(googleCallback.getCookies());
    var refreshSession = TestHelpers.entityOf(refresh, AuthSessionResponse.class);
    assertSession(refreshSession, "user-1", "user@example.test");
    assertCookiesPresent(refresh.getCookies());
    assertEquals(
        "csrf-1",
        refresh.getCookies().get(AuthCookieBuilder.CSRF_TOKEN_COOKIE).getValue()
    );
    assertEquals("refresh-1", authService.getLastRefreshToken());
    assertEquals(204, TestHelpers.statusOf(logout));
    assertEquals("refresh-1", authService.getRevokedToken());
  }


  private AuthResource resource(
      ResourceAuthService authService,
      ResourcePreferencesService preferencesService,
      CurrentUserContext currentUserContext
  ) {
    return new AuthResource(
        authService,
        preferencesService,
        currentUserContext,
        new AuthCookieBuilder(TestConfigFactory.defaultAuthConfig())
    );
  }

  private void assertRedirect(Response response, String location) {
    assertEquals(302, TestHelpers.statusOf(response));
    var loc = TestHelpers.locationOf(response);
    assertEquals(location, loc.toString());
  }

  private void assertSession(AuthSessionResponse session, String userId, String email) {
    assertEquals(userId, session.userId());
    assertEquals(email, session.email());
  }

  private void assertCookiesPresent(java.util.Map<String, ?> cookies) {
    assertTrue(cookies.containsKey(AuthCookieBuilder.ACCESS_TOKEN_COOKIE));
    assertTrue(cookies.containsKey(AuthCookieBuilder.REFRESH_TOKEN_COOKIE));
    assertTrue(cookies.containsKey(AuthCookieBuilder.CSRF_TOKEN_COOKIE));
  }
}
