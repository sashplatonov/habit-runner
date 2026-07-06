package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.auth.dto.UpdatePreferencesRequest;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
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

@SuppressWarnings({"PMD.LawOfDemeter", "PMD.TooManyMethods"})
class AuthServiceUnitCoverageTest {

  @Test
  void shouldReturnSessionWhenLoginFindsExistingUser() {
    var collaborators = new StubCollaborators();
    var service = new TestAuthService(collaborators);
    var user = user("user-1", "user@example.test");
    service.userByEmail = user;

    var tokenResponse = service.login(user.email);

    assertEquals("access::user-1::user@example.test::3600", tokenResponse.accessToken());
    assertEquals("refresh::user-1::30", tokenResponse.refreshToken());
    assertEquals(3600, tokenResponse.expiresIn());
  }

  @Test
  void shouldRejectLoginWhenUserIsMissing() {
    var service = new TestAuthService(new StubCollaborators());

    assertThrows(NotAuthorizedException.class, () -> service.login("missing@example.test"));
  }

  @Test
  void shouldRefreshTokenWhenActiveRefreshRecordAndUserExist() {
    var collaborators = new StubCollaborators();
    var service = new TestAuthService(collaborators);
    var refreshRecord = new RefreshTokenEntity();
    refreshRecord.token = "refresh-token";
    refreshRecord.userId = "user-1";
    collaborators.activeRefreshToken = refreshRecord;
    service.userById = user("user-1", "user@example.test");

    var tokenResponse = service.refreshToken("refresh-token");

    assertEquals("access::user-1::user@example.test::3600", tokenResponse.accessToken());
    assertEquals("refresh-token", tokenResponse.refreshToken());
  }

  @Test
  void shouldRejectRefreshWhenUserNoLongerExists() {
    var collaborators = new StubCollaborators();
    var service = new TestAuthService(collaborators);
    var refreshRecord = new RefreshTokenEntity();
    refreshRecord.token = "refresh-token";
    refreshRecord.userId = "missing-user";
    collaborators.activeRefreshToken = refreshRecord;

    assertThrows(NotAuthorizedException.class, () -> service.refreshToken("refresh-token"));
  }

  @Test
  void shouldDelegateTokenRevocationToCollaborators() {
    var collaborators = new StubCollaborators();
    var service = new TestAuthService(collaborators);

    service.revokeToken("refresh-token");

    assertEquals("refresh-token", collaborators.revokedToken);
  }

  @Test
  void shouldTranslateInvalidAccessTokenToUnauthorized() {
    var collaborators = new StubCollaborators();
    collaborators.verifyFailure = new IllegalArgumentException("invalid");
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
    collaborators.normalizedReturnTo = "/dashboard";
    var service = new TestAuthService(collaborators);
    service.currentTime = Instant.parse("2026-04-10T13:00:00Z");

    var authorizationUrl = service.createOAuthAuthorizationUrl("/settings");

    assertTrue(authorizationUrl.startsWith("https://accounts.example.test/start?state="));
    assertNotNull(service.storedState);
    assertEquals("/dashboard", service.storedState.returnTo());
    assertEquals(Instant.parse("2026-04-10T13:10:00Z"), service.storedState.expiresAt());
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
    service.currentTime = Instant.parse("2026-04-10T13:00:00Z");

    assertThrows(NotAuthorizedException.class, () -> service.handleOAuthCallback("code-123", "state-token"));

    var expiredState = new OAuthStateEntity();
    expiredState.state = "state-token";
    expiredState.returnTo = "/dashboard";
    expiredState.setExpiry(Instant.parse("2026-04-10T12:59:59Z"));
    service.oauthState = expiredState;

    assertThrows(NotAuthorizedException.class, () -> service.handleOAuthCallback("code-123", "state-token"));
    assertEquals("state-token", service.deletedState);
  }

  @Test
  void shouldBuildRedirectWhenOAuthCallbackStateIsValid() {
    var collaborators = new StubCollaborators();
    collaborators.oauthEmail = "oauth@example.test";
    collaborators.oauthUser = user("oauth-user", "oauth@example.test");
    collaborators.issuedSession = new TokenResponse("access-1", "refresh-1", 3600, "Bearer");
    collaborators.callbackRedirect = "https://app.example.test/callback?ok=1";
    var service = new TestAuthService(collaborators);
    service.currentTime = Instant.parse("2026-04-10T13:00:00Z");
    var oauthState = new OAuthStateEntity();
    oauthState.state = "state-token";
    oauthState.returnTo = "/dashboard";
    oauthState.setExpiry(Instant.parse("2026-04-10T13:10:00Z"));
    service.oauthState = oauthState;

    var redirect = service.handleOAuthCallback("code-123", "state-token");

    assertEquals("https://app.example.test/callback?ok=1", redirect);
    assertEquals("state-token", service.deletedState);
    assertEquals("code-123", collaborators.exchangedCode);
  }

  @Test
  void shouldHandleRefreshTokenServiceLifecycleWithoutDatabase() {
    var service = new TestRefreshTokenService();
    service.currentTime = Instant.parse("2026-04-10T14:00:00Z");
    var active = new RefreshTokenEntity();
    active.token = "refresh-token";
    active.userId = "user-1";
    active.revoked = false;
    active.setExpiry(Instant.parse("2026-04-10T14:05:00Z"));
    service.recordByToken = active;

    var required = service.requireActive("refresh-token");
    service.revoke("refresh-token");
    var created = service.create("new-refresh", "user-1", 30);

    assertEquals(active, required);
    assertTrue(active.revoked);
    assertEquals("new-refresh", created);
    assertNotNull(service.persistedRecord);
    assertEquals("user-1", service.persistedRecord.userId);
    assertEquals(Instant.parse("2026-05-10T14:00:00Z"), service.persistedRecord.expiresAt);
  }

  @Test
  void shouldRejectMissingOrExpiredRefreshToken() {
    var service = new TestRefreshTokenService();
    service.currentTime = Instant.parse("2026-04-10T14:00:00Z");

    assertThrows(NotAuthorizedException.class, () -> service.requireActive("missing"));

    var expired = new RefreshTokenEntity();
    expired.token = "expired-token";
    expired.userId = "user-1";
    expired.revoked = false;
    expired.setExpiry(Instant.parse("2026-04-10T13:59:59Z"));
    service.recordByToken = expired;

    assertThrows(NotAuthorizedException.class, () -> service.requireActive("expired-token"));
  }

  @Test
  void shouldIgnoreMissingRefreshTokenWhenRevocationRequested() {
    var service = new TestRefreshTokenService();

    service.revoke("missing-token");

    assertNull(service.recordByToken);
  }

  @Test
  void shouldReadAndUpdatePreferencesThroughOverriddenLookup() {
    var service = new TestPreferencesService();
    var user = user("user-1", "user@example.test");
    user.theme = "unsupported-theme";
    user.timezone = "Europe/Berlin";
    service.userById = user;

    var current = service.getUserPreferences("user-1");
    var updated = service.updateUserPreferences("user-1", new UpdatePreferencesRequest("sakura", " "));

    assertEquals("cloud", current.theme());
    assertEquals("Europe/Berlin", current.timezone());
    assertEquals("sakura", updated.theme());
    assertNull(updated.timezone());
    assertNull(user.timezone);
  }

  @Test
  void shouldKeepExistingTimezoneWhenPreferencesUpdateDoesNotProvideTimezone() {
    var service = new TestPreferencesService();
    var user = user("user-1", "user@example.test");
    user.theme = "cloud";
    user.timezone = "Europe/Paris";
    service.userById = user;

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
    existingService.existingUser = existingUser;

    var found = existingService.findOrCreateUser("user@example.test");

    assertEquals(existingUser, found);
    assertFalse(existingService.createInvoked);

    var creatingService = new TestUserService();
    var created = creatingService.findOrCreateUser("new@example.test");

    assertNotNull(created);
    assertEquals("new@example.test", created.email);
    assertTrue(creatingService.createInvoked);
  }

  private static UserEntity user(String id, String email) {
    var user = new UserEntity();
    user.id = id;
    user.email = email;
    user.theme = "cloud";
    return user;
  }

  private static final class TestAuthService extends AuthService {
    private UserEntity userByEmail;
    private UserEntity userById;
    private OAuthStateEntity oauthState;
    private StoredState storedState;
    private String deletedState;
    private Instant currentTime = Instant.parse("2026-04-10T13:00:00Z");

    TestAuthService(StubCollaborators collaborators) {
      super(TestConfigFactory.defaultAuthConfig(), collaborators);
    }

    @Override
    protected UserAccess userAccess() {
      return new UserAccess() {
        @Override
        public UserEntity findByEmail(String email) {
          return userByEmail;
        }

        @Override
        public UserEntity findRequiredById(String userId) {
          return userById;
        }
      };
    }

    @Override
    protected OAuthStateAccess oauthStateAccess() {
      return new OAuthStateAccess() {
        @Override
        public OAuthStateEntity consume(String state) {
          deletedState = state;
          return oauthState;
        }

        @Override
        public void save(OAuthStateEntity payload) {
          storedState = new StoredState(payload.state, payload.returnTo, payload.expiry());
        }
      };
    }

    @Override
    protected Instant now() {
      return currentTime;
    }
  }

  private record StoredState(String state, String returnTo, Instant expiresAt) {
  }

  private static final class StubCollaborators extends AuthCollaborators {
    private RefreshTokenEntity activeRefreshToken;
    private String revokedToken;
    private IllegalArgumentException verifyFailure;
    private String normalizedReturnTo = "/";
    private String exchangedCode;
    private String oauthEmail = "oauth@example.test";
    private UserEntity oauthUser = user("oauth-user", "oauth@example.test");
    private TokenResponse issuedSession = new TokenResponse("access-1", "refresh-1", 3600, "Bearer");
    private String callbackRedirect = "https://app.example.test/callback";

    StubCollaborators() {
      super(null, null, null, null);
    }

    @Override
    public RefreshTokenEntity requireActiveRefreshToken(String token) {
      return activeRefreshToken;
    }

    @Override
    public void revokeRefreshToken(String token) {
      revokedToken = token;
    }

    @Override
    public String createRefreshToken(String token, String userId, int days) {
      return "refresh::" + userId + "::" + days;
    }

    @Override
    public CurrentUser verifyToken(String token) {
      if (verifyFailure != null) {
        throw verifyFailure;
      }
      return new CurrentUser("verified-user", "verified@example.test");
    }

    @Override
    public String createAccessToken(String userId, String email, int ttlSeconds) {
      return "access::" + userId + "::" + email + "::" + ttlSeconds;
    }

    @Override
    public String normalizeReturnTo(String returnTo) {
      return normalizedReturnTo;
    }

    @Override
    public String buildAuthorizationUrl(String state) {
      return "https://accounts.example.test/start?state=" + state;
    }

    @Override
    public String exchangeCodeForEmail(String code) {
      exchangedCode = code;
      return oauthEmail;
    }

    @Override
    public UserEntity findOrCreateUser(String email) {
      return oauthUser;
    }

    @Override
    public TokenResponse issueTokenPair(UserEntity user, int accessTtlSeconds, int refreshDays) {
      return issuedSession;
    }

    @Override
    public String buildCallbackRedirect(String returnTo) {
      return callbackRedirect;
    }
  }

  private static final class TestRefreshTokenService extends RefreshTokenService {
    private RefreshTokenEntity recordByToken;
    private RefreshTokenEntity persistedRecord;
    private Instant currentTime = Instant.parse("2026-04-10T14:00:00Z");

    @Override
    protected RefreshTokenEntity findByToken(String token) {
      return recordByToken;
    }

    @Override
    protected RefreshTokenEntity newRefreshToken() {
      return new RefreshTokenEntity();
    }

    @Override
    protected void persistRefreshToken(RefreshTokenEntity refresh) {
      persistedRecord = refresh;
    }

    @Override
    protected Instant now() {
      return currentTime;
    }
  }

  private static final class TestPreferencesService extends PreferencesService {
    private UserEntity userById;

    @Override
    protected UserEntity findUserById(String userId) {
      return userById;
    }
  }

  private static final class TestUserService extends UserService {
    private UserEntity existingUser;
    private boolean createInvoked;

    @Override
    protected UserEntity findByEmail(String email) {
      return existingUser;
    }

    @Override
    protected UserEntity createUser(String email) {
      createInvoked = true;
      return user("created-user", email);
    }
  }
}
