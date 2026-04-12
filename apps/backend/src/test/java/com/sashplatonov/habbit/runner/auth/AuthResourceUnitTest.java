package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.dto.LoginRequest;
import com.sashplatonov.habbit.runner.auth.dto.AuthSessionResponse;
import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.auth.dto.UpdatePreferencesRequest;
import com.sashplatonov.habbit.runner.auth.dto.UserPreferencesResponse;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SuppressWarnings("PMD.LawOfDemeter")
class AuthResourceUnitTest {

  @Test
  void shouldDelegateAuthEndpointsToAuthService() {
    var authService = new ResourceAuthService();
    authService.loginResponse = new TokenResponse("access-1", "refresh-1", 3600, "Bearer");
    authService.refreshResponse = new TokenResponse("access-2", "refresh-2", 3600, "Bearer");
    authService.googleStartRedirect = "https://accounts.example.test/start";
    authService.googleCallbackRedirect = new AuthService.OAuthCallbackSession(
        "https://app.example.test/callback",
        new TokenResponse("access-3", "refresh-3", 3600, "Bearer")
    );
    var resource = resource(authService, new ResourcePreferencesService(), new CurrentUserContext());

    var login = resource.login(new LoginRequest("user@example.test"));
    var googleStart = resource.startGoogle("/dashboard");
    var googleCallback = resource.googleCallback("code-123", "state-123");
    var refresh = resource.refresh("refresh-1");
    var logout = resource.logout("refresh-1");

    assertEquals("user@example.test", authService.lastLoginEmail);
    assertSession(login, "user-1", "user@example.test");
    assertCookiesPresent(login);
    assertEquals("/dashboard", authService.lastReturnTo);
    assertRedirect(googleStart, "https://accounts.example.test/start");
    assertEquals("code-123", authService.lastCode);
    assertEquals("state-123", authService.lastState);
    assertRedirect(googleCallback, "https://app.example.test/callback");
    assertCookiesPresent(googleCallback);
    assertSession(refresh, "user-1", "user@example.test");
    assertCookiesPresent(refresh);
    assertEquals("refresh-1", authService.lastRefreshToken);
    assertEquals(204, logout.getStatus());
    assertEquals("refresh-1", authService.revokedToken);
  }

  @Test
  void shouldDelegatePreferenceEndpointsToPreferencesServiceForCurrentUser() {
    var preferencesService = new ResourcePreferencesService();
    preferencesService.getResponse = new UserPreferencesResponse("cloud", "Europe/Berlin");
    preferencesService.updateResponse = new UserPreferencesResponse("matrix", null);
    var currentUserContext = new CurrentUserContext();
    currentUserContext.setUser(new CurrentUser("user-1", "user@example.test"));
    var resource = resource(new ResourceAuthService(), preferencesService, currentUserContext);

    var current = resource.getPreferences();
    var updated = resource.updatePreferences(new UpdatePreferencesRequest("matrix", null));

    assertEquals("user-1", preferencesService.lastUserId);
    assertEquals(preferencesService.getResponse, current.getEntity());
    assertEquals(preferencesService.updateResponse, updated.getEntity());
    assertEquals("matrix", preferencesService.lastRequest.theme());
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
    assertEquals(302, response.getStatus());
    assertEquals(location, response.getLocation().toString());
  }

  private void assertSession(Response response, String userId, String email) {
    assertEquals(200, response.getStatus());
    var session = (AuthSessionResponse) response.getEntity();
    assertEquals(userId, session.userId());
    assertEquals(email, session.email());
  }

  private void assertCookiesPresent(Response response) {
    assertTrue(response.getCookies().containsKey(AuthCookieBuilder.ACCESS_TOKEN_COOKIE));
    assertTrue(response.getCookies().containsKey(AuthCookieBuilder.REFRESH_TOKEN_COOKIE));
    assertTrue(response.getCookies().containsKey(AuthCookieBuilder.CSRF_TOKEN_COOKIE));
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

  private static final class ResourcePreferencesService extends PreferencesService {
    private String lastUserId;
    private UpdatePreferencesRequest lastRequest;
    private UserPreferencesResponse getResponse;
    private UserPreferencesResponse updateResponse;

    @Override
    public UserPreferencesResponse getUserPreferences(String userId) {
      lastUserId = userId;
      return getResponse;
    }

    @Override
    public UserPreferencesResponse updateUserPreferences(String userId, UpdatePreferencesRequest request) {
      lastUserId = userId;
      lastRequest = request;
      return updateResponse;
    }
  }
}