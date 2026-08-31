package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OAuthAuthorizationServiceTest {

  @Test
  void shouldCreateOAuthAuthorizationUrlAndStoreNormalizedState() {
    var oauthSupport = mock(OAuthSupport.class);
    when(oauthSupport.normalizeReturnTo("/settings")).thenReturn("/dashboard");
    when(oauthSupport.buildAuthorizationUrl(any())).thenReturn("https://accounts.example.test/start?state=token");
    var stateAccess = new StubOAuthStateAccess(null);
    var service = new FixedClockOAuthAuthorizationService(oauthSupport, stateAccess);

    var authorizationUrl = service.createAuthorizationUrl("/settings");

    assertTrue(authorizationUrl.startsWith("https://accounts.example.test/start?state="));
    verify(oauthSupport).buildAuthorizationUrl(any());
    var stored = stateAccess.savedState();
    assertNotNull(stored);
    assertEquals("/dashboard", stored.returnTo);
    assertEquals(Instant.parse("2026-04-10T13:10:00Z"), stored.expiry());
  }

  @Test
  void shouldCreateGoogleLinkAuthorizationUrlWithOwnerIntent() {
    var oauthSupport = mock(OAuthSupport.class);
    when(oauthSupport.normalizeReturnTo("/app/account")).thenReturn("/app/account");
    when(oauthSupport.buildAuthorizationUrl(any())).thenReturn("https://accounts.example.test/link?state=token");
    var stateAccess = new StubOAuthStateAccess(null);
    var service = new FixedClockOAuthAuthorizationService(oauthSupport, stateAccess);

    var authorizationUrl = service.createLinkAuthorizationUrl("telegram-user", "/app/account");

    assertTrue(authorizationUrl.startsWith("https://accounts.example.test/link?state="));
    assertEquals("telegram-user", stateAccess.savedState().linkUserId());
    assertEquals("/app/account", stateAccess.savedState().returnTo);
  }
}
