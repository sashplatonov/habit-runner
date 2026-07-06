package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.dto.UpdatePreferencesRequest;
import com.sashplatonov.habbit.runner.auth.dto.UserPreferencesResponse;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
import com.sashplatonov.habbit.runner.support.TestHelpers;
import org.junit.jupiter.api.Test;

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
}
