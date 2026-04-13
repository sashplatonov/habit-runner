package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.dto.LoginRequest;
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
    authService.setLoginResponse(new TokenResponse("access-1", "refresh-1", 3600, "Bearer"));
    authService.setRefreshResponse(new TokenResponse("access-2", "refresh-2", 3600, "Bearer"));
    authService.setGoogleStartRedirect("https://accounts.example.test/start");
    authService.setGoogleCallbackRedirect(new AuthService.OAuthCallbackSession(
      "https://app.example.test/callback",
      new TokenResponse("access-3", "refresh-3", 3600, "Bearer")
    ));
    var resource = resource(authService, new ResourcePreferencesService(), new CurrentUserContext());

    var login = resource.login(new LoginRequest("user@example.test"));
    var googleStart = resource.startGoogle("/dashboard");
    var googleCallback = resource.googleCallback("code-123", "state-123");
    var refresh = resource.refresh("refresh-1");
    var logout = resource.logout("refresh-1");

    assertEquals("user@example.test", authService.lastLoginEmail);
    AuthSessionResponse loginSession = TestHelpers.entityOf(login);
    assertSession(loginSession, "user-1", "user@example.test");
    assertCookiesPresent(login.getCookies());
    assertEquals("/dashboard", authService.lastReturnTo);
    assertRedirect(googleStart, "https://accounts.example.test/start");
    assertEquals("code-123", authService.lastCode);
    assertEquals("state-123", authService.lastState);
    assertRedirect(googleCallback, "https://app.example.test/callback");
    assertCookiesPresent(googleCallback.getCookies());
    AuthSessionResponse refreshSession = TestHelpers.entityOf(refresh);
    assertSession(refreshSession, "user-1", "user@example.test");
    assertCookiesPresent(refresh.getCookies());
    assertEquals("refresh-1", authService.lastRefreshToken);
    assertEquals(204, TestHelpers.statusOf(logout));
    assertEquals("refresh-1", authService.revokedToken);
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

  private static final class ResourceAuthService extends AuthService {
    private String lastLoginEmail;
    private String lastRefreshToken;
    private String lastReturnTo;
    private String lastCode;
    private String lastState;
    private String revokedToken;
    private TokenResponse loginResponse;
    private TokenResponse refreshResponse;
    private String googleStartRedirect;
    private AuthService.OAuthCallbackSession googleCallbackRedirect;

    ResourceAuthService() {
      super(TestConfigFactory.defaultAuthConfig(), new AuthCollaborators(null, null, null, null));
    }

    public void setLoginResponse(TokenResponse r) { this.loginResponse = r; }
    public void setRefreshResponse(TokenResponse r) { this.refreshResponse = r; }
    public void setGoogleStartRedirect(String url) { this.googleStartRedirect = url; }
    public void setGoogleCallbackRedirect(AuthService.OAuthCallbackSession s) { this.googleCallbackRedirect = s; }

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
    public AuthService.OAuthCallbackSession handleOAuthCallbackSession(String code, String state) {
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

  
}