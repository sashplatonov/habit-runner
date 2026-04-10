package com.habittracker.auth;

import com.habittracker.auth.dto.LoginRequest;
import com.habittracker.auth.dto.RefreshRequest;
import com.habittracker.auth.dto.TokenResponse;
import com.habittracker.auth.dto.UpdatePreferencesRequest;
import com.habittracker.auth.dto.UserPreferencesResponse;
import com.habittracker.support.TestConfigFactory;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SuppressWarnings("PMD.LawOfDemeter")
class AuthResourceUnitTest {

  @Test
  void shouldDelegateAuthEndpointsToAuthService() {
    var authService = new ResourceAuthService();
    authService.loginResponse = new TokenResponse("access-1", "refresh-1", 3600, "Bearer");
    authService.refreshResponse = new TokenResponse("access-2", "refresh-2", 3600, "Bearer");
    authService.googleStartRedirect = "https://accounts.example.test/start";
    authService.googleCallbackRedirect = "https://app.example.test/callback";
    var resource = new AuthResource(authService, new ResourcePreferencesService(), new CurrentUserContext());

    var login = resource.login(new LoginRequest("user@example.test"));
    var googleStart = resource.startGoogle("/dashboard");
    var googleCallback = resource.googleCallback("code-123", "state-123");
    var refresh = resource.refresh(new RefreshRequest("refresh-1"));
    var logout = resource.logout(new RefreshRequest("refresh-1"));

    assertEquals("user@example.test", authService.lastLoginEmail);
    assertEquals(login, authService.loginResponse);
    assertEquals("/dashboard", authService.lastReturnTo);
    assertRedirect(googleStart, "https://accounts.example.test/start");
    assertEquals("code-123", authService.lastCode);
    assertEquals("state-123", authService.lastState);
    assertRedirect(googleCallback, "https://app.example.test/callback");
    assertEquals(refresh, authService.refreshResponse);
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
    var resource = new AuthResource(new ResourceAuthService(), preferencesService, currentUserContext);

    var current = resource.getPreferences();
    var updated = resource.updatePreferences(new UpdatePreferencesRequest("matrix", null));

    assertEquals("user-1", preferencesService.lastUserId);
    assertEquals(current, preferencesService.getResponse);
    assertEquals(updated, preferencesService.updateResponse);
    assertEquals("matrix", preferencesService.lastRequest.theme());
  }

  private void assertRedirect(Response response, String location) {
    assertEquals(302, response.getStatus());
    assertEquals(location, response.getLocation().toString());
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
    private String googleCallbackRedirect;

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
    public String handleOAuthCallback(String code, String state) {
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