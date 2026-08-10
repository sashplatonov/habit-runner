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
import com.sashplatonov.habbit.runner.auth.service.OAuthAccountLinkService;
import com.sashplatonov.habbit.runner.auth.service.RefreshTokenService;
import com.sashplatonov.habbit.runner.auth.service.UserService;
import com.sashplatonov.habbit.runner.auth.support.AuthCollaborators;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthSupport;
import com.sashplatonov.habbit.runner.auth.support.RefreshTokenDigest;
import com.sashplatonov.habbit.runner.auth.support.OAuthCallbackSession;
import com.sashplatonov.habbit.runner.auth.support.OAuthHelper;
import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;
import com.sashplatonov.habbit.runner.auth.support.ThemeCatalog;
import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.auth.dto.UpdatePreferencesRequest;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthServiceUnitCoverageTest {

  @Test
  void shouldRefreshTokenWhenActiveRefreshRecordAndUserExist() {
    var collaborators = new StubCollaborators();
    var service = new TestAuthService(collaborators);
    var refreshRecord = new RefreshTokenEntity();
    refreshRecord.setTokenHash(RefreshTokenDigest.hash("refresh-token"));
    refreshRecord.setFamilyId("family-1");
    refreshRecord.setUserId("user-1");
    collaborators.setActiveRefreshToken(refreshRecord);
    service.setUserById(user("user-1", "user@example.test"));

    var tokenResponse = service.refreshToken("refresh-token");

    assertEquals("access::user-1::user@example.test::3600", tokenResponse.accessToken());
    assertEquals("rotated-refresh", tokenResponse.refreshToken());
  }

  @Test
  void shouldRejectRefreshWhenUserNoLongerExists() {
    var collaborators = new StubCollaborators();
    var service = new TestAuthService(collaborators);
    var refreshRecord = new RefreshTokenEntity();
    refreshRecord.setTokenHash(RefreshTokenDigest.hash("refresh-token"));
    refreshRecord.setFamilyId("family-1");
    refreshRecord.setUserId("missing-user");
    collaborators.setActiveRefreshToken(refreshRecord);

    assertThrows(NotAuthorizedException.class, () -> service.refreshToken("refresh-token"));
  }

  @Test
  void shouldDelegateTokenRevocationToCollaborators() {
    var collaborators = new StubCollaborators();
    var service = new TestAuthService(collaborators);

    service.revokeToken("refresh-token");

    assertEquals("refresh-token", collaborators.getRevokedToken());
  }

  @Test
  void shouldTranslateInvalidAccessTokenToUnauthorized() {
    var collaborators = new StubCollaborators();
    collaborators.setVerifyFailure(new IllegalArgumentException("invalid"));
    var service = new TestAuthService(collaborators);

    assertThrows(NotAuthorizedException.class, () -> service.verifyAccessToken("bad-token"));
  }

  @Test
  void shouldReturnCurrentUserWhenAccessTokenIsValid() {
    var service = new TestAuthService(new StubCollaborators());

    var currentUser = service.verifyAccessToken("good-token");

    assertEquals("verified-user", currentUser.id());
    assertEquals("verified@example.test", currentUser.email());
  }

  @Test
  void shouldCreateOAuthAuthorizationUrlAndStoreNormalizedState() {
    var collaborators = new StubCollaborators();
    collaborators.setNormalizedReturnTo("/dashboard");
    var service = new TestAuthService(collaborators);
    service.setCurrentTime(Instant.parse("2026-04-10T13:00:00Z"));

    var authorizationUrl = service.createOAuthAuthorizationUrl("/settings");

    assertTrue(authorizationUrl.startsWith("https://accounts.example.test/start?state="));
    assertNotNull(service.getStoredState());
    assertEquals("/dashboard", service.getStoredState().returnTo());
    assertEquals(Instant.parse("2026-04-10T13:10:00Z"), service.getStoredState().expiresAt());
  }

  @Test
  void shouldCreateGoogleLinkAuthorizationUrlWithOwnerIntent() {
    var collaborators = new StubCollaborators();
    collaborators.setNormalizedReturnTo("/app/account");
    var service = new TestAuthService(collaborators);

    var authorizationUrl = service.createGoogleLinkAuthorizationUrl("telegram-user", "/app/account");

    assertTrue(authorizationUrl.startsWith("https://accounts.example.test/start?state="));
    assertEquals("telegram-user", service.getStoredState().linkUserId());
    assertEquals("/app/account", service.getStoredState().returnTo());
  }

  @Test
  void shouldRejectOAuthCallbackWhenParametersAreMissing() {
    var service = new TestAuthService(new StubCollaborators());

    assertThrows(BadRequestException.class, () -> service.handleOAuthCallback(" ", "state-token"));
    assertThrows(BadRequestException.class, () -> service.handleOAuthCallback("code-123", " "));
  }

  @Test
  void shouldRejectOAuthCallbackWhenStateIsMissingOrExpired() {
    var service = new TestAuthService(new StubCollaborators());
    service.setCurrentTime(Instant.parse("2026-04-10T13:00:00Z"));

    assertThrows(NotAuthorizedException.class, () -> service.handleOAuthCallback("code-123", "state-token"));

    var expiredState = new OAuthStateEntity();
    expiredState.state = "state-token";
    expiredState.returnTo = "/dashboard";
    expiredState.setExpiry(Instant.parse("2026-04-10T12:59:59Z"));
    service.setOauthState(expiredState);

    assertThrows(NotAuthorizedException.class, () -> service.handleOAuthCallback("code-123", "state-token"));
    assertEquals("state-token", service.getDeletedState());
  }

  @Test
  void shouldBuildRedirectWhenOAuthCallbackStateIsValid() {
    var collaborators = new StubCollaborators();
    collaborators.setOauthEmail("oauth@example.test");
    collaborators.setOauthUser(user("oauth-user", "oauth@example.test"));
    collaborators.setIssuedSession(new TokenResponse("access-1", "refresh-1", 3600, "Bearer"));
    collaborators.setCallbackRedirect("https://app.example.test/callback?ok=1");
    var service = new TestAuthService(collaborators);
    service.setCurrentTime(Instant.parse("2026-04-10T13:00:00Z"));
    var oauthState = new OAuthStateEntity();
    oauthState.state = "state-token";
    oauthState.returnTo = "/dashboard";
    oauthState.setExpiry(Instant.parse("2026-04-10T13:10:00Z"));
    service.setOauthState(oauthState);

    var redirect = service.handleOAuthCallback("code-123", "state-token");

    assertEquals("https://app.example.test/callback?ok=1", redirect);
    assertEquals("state-token", service.getDeletedState());
    assertEquals("code-123", collaborators.getExchangedCode());
  }

  @Test
  void shouldMergeGoogleAccountIntoTelegramOwnerWhenLinkIntentIsPresent() {
    var collaborators = new StubCollaborators();
    var telegramOwner = user("telegram-user", null);
    var googleUser = user("google-user", "oauth@example.test");
    collaborators.setUserById(telegramOwner);
    collaborators.setOauthUser(googleUser);
    var service = new TestAuthService(collaborators);
    var merge = new RecordingOAuthAccountLinkService();
    service.setAccountLinkService(merge);
    var oauthState = new OAuthStateEntity();
    oauthState.state = "state-token";
    oauthState.returnTo = "/app/account";
    oauthState.setExpiry(Instant.parse("2026-04-10T13:10:00Z"));
    oauthState.setLinkUserId("telegram-user");
    service.setOauthState(oauthState);

    service.handleOAuthCallback("code-123", "state-token");

    assertEquals("telegram-user", merge.survivor());
    assertEquals("google-user", merge.absorbed());
  }

  @Test
  void shouldKeepExistingUserWhenGoogleLinkAlreadyPointsToThatUser() {
    var collaborators = new StubCollaborators();
    var user = user("same-user", "old@example.test");
    collaborators.setUserById(user);
    var service = new OAuthAccountLinkService(collaborators);

    var resolved = service.resolve(user, "new@example.test", "same-user");

    assertEquals(user, resolved);
    assertEquals("new@example.test", user.getEmail());
  }

  @Test
  void shouldReturnGoogleUserWhenNoLinkIntentExists() {
    var user = user("google-user", "oauth@example.test");
    var service = new OAuthAccountLinkService();

    assertEquals(user, service.resolve(user, user.getEmail(), null));
  }

  @Test
  void shouldHandleRefreshTokenServiceLifecycleWithoutDatabase() {
    var service = new TestRefreshTokenService();
    service.setCurrentTime(Instant.parse("2026-04-10T14:00:00Z"));
    var active = new RefreshTokenEntity();
    active.setTokenHash(RefreshTokenDigest.hash("refresh-token"));
    active.setUserId("user-1");
    active.setRevoked(false);
    active.setExpiresAt(Instant.parse("2026-04-10T14:05:00Z"));
    service.setRecordByToken(active);

    var required = service.requireActive("refresh-token");
    service.revoke("refresh-token");
    var created = service.create("new-refresh", "user-1", 30);

    assertEquals(active, required);
    assertTrue(active.isRevoked());
    assertEquals("new-refresh", created);
    assertNotNull(service.getPersistedRecord());
    assertEquals("user-1", service.getPersistedRecord().getUserId());
    assertEquals(Instant.parse("2026-05-10T14:00:00Z"), service.getPersistedRecord().getExpiresAt());
  }

  @Test
  void shouldRejectMissingOrExpiredRefreshToken() {
    var service = new TestRefreshTokenService();
    service.setCurrentTime(Instant.parse("2026-04-10T14:00:00Z"));

    assertThrows(NotAuthorizedException.class, () -> service.requireActive("missing"));

    var expired = new RefreshTokenEntity();
    expired.setTokenHash(RefreshTokenDigest.hash("expired-token"));
    expired.setUserId("user-1");
    expired.setRevoked(false);
    expired.setExpiresAt(Instant.parse("2026-04-10T13:59:59Z"));
    service.setRecordByToken(expired);

    assertThrows(NotAuthorizedException.class, () -> service.requireActive("expired-token"));
  }

  @Test
  void shouldIgnoreMissingRefreshTokenWhenRevocationRequested() {
    var service = new TestRefreshTokenService();

    service.revoke("missing-token");

    assertNull(service.getRecordByToken());
  }

  @Test
  void shouldReadAndUpdatePreferencesThroughOverriddenLookup() {
    var service = new TestPreferencesService();
    var user = user("user-1", "user@example.test");
    user.setTheme("unsupported-theme");
    user.setTimezone("Europe/Berlin");
    service.setUserById(user);

    var current = service.getUserPreferences("user-1");
    var updated = service.updateUserPreferences("user-1", new UpdatePreferencesRequest("sakura", " "));

    assertEquals("cloud", current.theme());
    assertEquals("Europe/Berlin", current.timezone());
    assertEquals("sakura", updated.theme());
    assertNull(updated.timezone());
    assertNull(user.getTimezone());
  }

  @Test
  void shouldKeepExistingTimezoneWhenPreferencesUpdateDoesNotProvideTimezone() {
    var service = new TestPreferencesService();
    var user = user("user-1", "user@example.test");
    user.setTheme("cloud");
    user.setTimezone("Europe/Paris");
    service.setUserById(user);

    var updated = service.updateUserPreferences("user-1", new UpdatePreferencesRequest("matrix", null));

    assertEquals("matrix", updated.theme());
    assertEquals("Europe/Paris", updated.timezone());
  }

  @Test
  void shouldRejectPreferencesWhenUserIsMissing() {
    var service = new TestPreferencesService();

    assertThrows(NotAuthorizedException.class, () -> service.getUserPreferences("missing-user"));
    assertThrows(
        NotAuthorizedException.class,
        () -> service.updateUserPreferences("missing-user", new UpdatePreferencesRequest("cloud", null))
    );
  }

  @Test
  void shouldCreateOrReuseUserThroughUserServiceSeams() {
    var existingUser = user("user-1", "user@example.test");
    var existingService = new TestUserService();
    existingService.setExistingUser(existingUser);

    var found = existingService.findOrCreateUser("user@example.test");

    assertEquals(existingUser, found);
    assertFalse(existingService.isCreateInvoked());

    var creatingService = new TestUserService();
    var created = creatingService.findOrCreateUser("new@example.test");

    assertNotNull(created);
    assertEquals("new@example.test", created.getEmail());
    assertTrue(creatingService.isCreateInvoked());
  }

  static UserEntity user(String id, String email) {
    var user = new UserEntity();
    user.setId(id);
    user.setEmail(email);
    user.setTheme("cloud");
    return user;
  }
}
