package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.ResourceAuthService;
import com.sashplatonov.habbit.runner.auth.ResourcePreferencesService;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitService;
import com.sashplatonov.habbit.runner.auth.support.AuthResourceSupport;
import com.sashplatonov.habbit.runner.auth.support.OAuthCallbackSession;
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

  @Test
  void shouldStartGoogleLinkForAuthenticatedUser() {
    var authService = new ResourceAuthService();
    authService.setGoogleLinkStartRedirect("https://accounts.example.test/link");
    var context = new CurrentUserContext();
    context.setUser(new CurrentUser("telegram-user", null));
    var resource = resource(authService, new ResourcePreferencesService(), context);

    var response = resource.startGoogleLink("/app/account");

    assertRedirect(response, "https://accounts.example.test/link");
    assertEquals("/app/account", authService.getLastReturnTo());
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
        new AuthResourceSupport(
            new AuthCookieBuilder(TestConfigFactory.defaultAuthConfig()),
            new AuthRateLimitService()
        )
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
