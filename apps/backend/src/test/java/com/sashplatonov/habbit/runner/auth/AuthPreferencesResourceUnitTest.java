package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.dto.UpdatePreferencesRequest;
import com.sashplatonov.habbit.runner.auth.dto.UserPreferencesResponse;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
import com.sashplatonov.habbit.runner.support.TestHelpers;
// Response not required here; keep imports minimal to satisfy PMD
import org.junit.jupiter.api.Test;
import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AuthPreferencesResourceUnitTest {

  @Test
  void shouldDelegatePreferenceEndpointsToPreferencesServiceForCurrentUser() {
    var preferencesService = new ResourcePreferencesService();
    preferencesService.setGetResponse(new UserPreferencesResponse("cloud", "Europe/Berlin"));
    preferencesService.setUpdateResponse(new UserPreferencesResponse("matrix", null));
    var currentUserContext = new CurrentUserContext();
    currentUserContext.setUser(new CurrentUser("user-1", "user@example.test"));
    var resource = resource(new ResourceAuthService(), preferencesService, currentUserContext);

    var current = resource.getPreferences();
    var updated = resource.updatePreferences(new UpdatePreferencesRequest("matrix", null));

    assertEquals("user-1", preferencesService.getLastUserId());
    assertEquals(preferencesService.getGetResponse(), TestHelpers.entityOf(current));
    assertEquals(preferencesService.getUpdateResponse(), TestHelpers.entityOf(updated));
    assertEquals("matrix", preferencesService.getLastRequestTheme());
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

  private static final class ResourceAuthService extends AuthService {
    // Only the preferences test needs minimal behavior; unused fields removed to avoid PMD warnings
    private TokenResponse loginResponse;
    private TokenResponse refreshResponse;
    private String googleStartRedirect;
    private AuthService.OAuthCallbackSession googleCallbackRedirect;
    private String lastCode;
    private String lastState;
    private String lastRefreshToken;
    private String revokedToken;

    ResourceAuthService() {
      super(TestConfigFactory.defaultAuthConfig(), new AuthCollaborators(null, null, null, null));
    }

    public void setLoginResponse(TokenResponse r) { this.loginResponse = r; }
    public void setRefreshResponse(TokenResponse r) { this.refreshResponse = r; }
    public void setGoogleStartRedirect(String url) { this.googleStartRedirect = url; }
    public void setGoogleCallbackRedirect(AuthService.OAuthCallbackSession s) { this.googleCallbackRedirect = s; }

    public String getLastCode() { return lastCode; }
    public String getLastState() { return lastState; }
    public String getLastRefreshToken() { return lastRefreshToken; }
    public String getRevokedToken() { return revokedToken; }

    @Override
    public TokenResponse login(String email) {
      return loginResponse;
    }

    @Override
    public String createOAuthAuthorizationUrl(String returnTo) {
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
