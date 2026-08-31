package com.sashplatonov.habbit.runner.auth.resource;

import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.service.OAuthAuthorizationService;
import com.sashplatonov.habbit.runner.auth.service.OAuthExchangeService;
import com.sashplatonov.habbit.runner.auth.service.RefreshSessionService;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthRateLimitService;
import com.sashplatonov.habbit.runner.auth.support.AuthResourceSupport;
import com.sashplatonov.habbit.runner.auth.support.OAuthCallbackSession;
import com.sashplatonov.habbit.runner.auth.support.RefreshedSession;
import com.sashplatonov.habbit.runner.auth.dto.AuthSessionResponse;
import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetricsInstrumentation;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import com.sashplatonov.habbit.runner.support.TestHelpers;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthResourceUnitTest {

  @Test
  void shouldDelegateGoogleOAuthEndpointsToServices() {
    var authorizationService = mock(OAuthAuthorizationService.class);
    var exchangeService = mock(OAuthExchangeService.class);
    when(authorizationService.createAuthorizationUrl("/dashboard"))
        .thenReturn("https://accounts.example.test/start");
    when(exchangeService.exchange("code-123", "state-123"))
        .thenReturn(new OAuthCallbackSession(
            "https://app.example.test/callback",
            new TokenResponse("access-3", "refresh-3", 3600, "Bearer")
        ));
    var startResource = googleStartResource(authorizationService, new CurrentUserContext());
    var callbackResource = googleCallbackResource(exchangeService);

    var googleStart = startResource.startGoogle("/dashboard");
    var googleCallback = callbackResource.googleCallback("code-123", "state-123");

    assertRedirect(googleStart, "https://accounts.example.test/start");
    assertRedirect(googleCallback, "https://app.example.test/callback");
    assertCookiesPresent(googleCallback.getCookies());
    verify(exchangeService).exchange("code-123", "state-123");
  }

  @Test
  void shouldStartGoogleLinkForAuthenticatedUser() {
    var authorizationService = mock(OAuthAuthorizationService.class);
    when(authorizationService.createLinkAuthorizationUrl("telegram-user", "/app/account"))
        .thenReturn("https://accounts.example.test/link");
    var context = new CurrentUserContext();
    context.setUser(new CurrentUser("telegram-user", null));
    var resource = googleStartResource(authorizationService, context);

    var response = resource.startGoogleLink("/app/account");

    assertRedirect(response, "https://accounts.example.test/link");
    verify(authorizationService).createLinkAuthorizationUrl("telegram-user", "/app/account");
  }

  @Test
  void shouldDelegateRefreshAndLogoutToRefreshSessionService() {
    var refreshService = mock(RefreshSessionService.class);
    when(refreshService.refresh("refresh-1"))
        .thenReturn(new RefreshedSession(
            "access-2", "refresh-2", 3600, new CurrentUser("user-1", "user@example.test")));
    var resource = sessionResource(refreshService, new CurrentUserContext());

    var refresh = resource.refresh("refresh-1", "csrf-1");
    var logout = resource.logout("refresh-1");

    var refreshSession = TestHelpers.entityOf(refresh, AuthSessionResponse.class);
    assertSession(refreshSession, "user-1", "user@example.test");
    assertCookiesPresent(refresh.getCookies());
    assertEquals(
        "csrf-1",
        refresh.getCookies().get(AuthCookieBuilder.CSRF_TOKEN_COOKIE).getValue()
    );
    assertEquals(204, TestHelpers.statusOf(logout));
    verify(refreshService).refresh("refresh-1");
    verify(refreshService).revoke("refresh-1");
  }

  @Test
  void shouldReturnCurrentUserFromSessionEndpoint() {
    var context = new CurrentUserContext();
    context.setUser(new CurrentUser("user-1", "user@example.test"));
    var resource = sessionResource(mock(RefreshSessionService.class), context);

    var session = resource.session();

    var body = TestHelpers.entityOf(session, AuthSessionResponse.class);
    assertSession(body, "user-1", "user@example.test");
  }

  private GoogleOAuthStartResource googleStartResource(
      OAuthAuthorizationService authorizationService,
      CurrentUserContext currentUserContext
  ) {
    return new GoogleOAuthStartResource(
        authorizationService,
        new AuthResourceSupport(
            new AuthCookieBuilder(TestConfigFactory.defaultAuthConfig()),
            new AuthRateLimitService()
        ),
        currentUserContext
    );
  }

  private GoogleOAuthCallbackResource googleCallbackResource(
      OAuthExchangeService exchangeService
  ) {
    return new GoogleOAuthCallbackResource(
        exchangeService,
        new AuthResourceSupport(
            new AuthCookieBuilder(TestConfigFactory.defaultAuthConfig()),
            new AuthRateLimitService()
        ),
        mock(ServiceMetricsInstrumentation.class)
    );
  }

  private AuthSessionResource sessionResource(
      RefreshSessionService refreshService,
      CurrentUserContext currentUserContext
  ) {
    return new AuthSessionResource(
        refreshService,
        new AuthResourceSupport(
            new AuthCookieBuilder(TestConfigFactory.defaultAuthConfig()),
            new AuthRateLimitService()
        ),
        currentUserContext,
        mock(ServiceMetricsInstrumentation.class)
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
