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
import com.sashplatonov.habbit.runner.auth.service.RefreshTokenService;
import com.sashplatonov.habbit.runner.auth.service.UserService;
import com.sashplatonov.habbit.runner.auth.support.AuthCollaborators;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthSupport;
import com.sashplatonov.habbit.runner.auth.support.OAuthCallbackSession;
import com.sashplatonov.habbit.runner.auth.support.OAuthHelper;
import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;
import com.sashplatonov.habbit.runner.auth.support.ThemeCatalog;
import com.sashplatonov.habbit.runner.auth.dto.UpdatePreferencesRequest;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.support.AuthenticatedApiTestSupport;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotAuthorizedException;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class AuthPersistenceCoverageTest extends AuthenticatedApiTestSupport {

  @Inject
  UserService userService;

  @Inject
  RefreshTokenService refreshTokenService;

  @Inject
  PreferencesService preferencesService;

  @Test
  void shouldCreateAndReuseUserThroughRealPersistenceService() throws Exception {
    var email = UUID.randomUUID() + "@example.test";

    var created = inTransaction(() -> userService.findOrCreateUser(email));
    var found = inTransaction(() -> userService.findOrCreateUser(email));

    assertNotNull(created.getId());
    assertEquals(email, created.getEmail());
    assertEquals("cloud", created.getTheme());
    assertEquals(created.getId(), found.getId());
    assertEquals(1L, UserEntity.count("email", email));
  }

  @Test
  void shouldCreateRequireAndRevokeRefreshTokensThroughRealPersistenceService() throws Exception {
    var user = inTransaction(() -> {
      var entity = new UserEntity();
      entity.setEmail(UUID.randomUUID() + "@example.test");
      entity.setTheme("cloud");
      entity.persist();
      return entity;
    });

    var token = "refresh-" + UUID.randomUUID();
    var createdToken = inTransaction(() -> refreshTokenService.create(token, user.getId(), 30));
    var active = inTransaction(() -> refreshTokenService.requireActive(token));
    inTransaction(() -> refreshTokenService.revoke(token));
    RefreshTokenEntity stored = inTransaction(() -> {
      var q = RefreshTokenEntity.<RefreshTokenEntity>find("token", token);
      return q.firstResult();
    });

    assertEquals(token, createdToken);
    assertEquals(token, active.getToken());
    assertEquals(user.getId(), stored.getUserId());
    assertTrue(stored.isRevoked());
    assertThrows(NotAuthorizedException.class, () -> inTransaction(() -> refreshTokenService.requireActive(token)));
  }

  @Test
  void shouldKeepUserCreatedAtStableAndAdvanceUpdatedAtWhenPreferencesChange() throws Exception {
    var initialCreatedAt = Instant.parse("2026-04-09T08:00:00Z");
    var initialUpdatedAt = Instant.parse("2026-04-09T08:05:00Z");
    var userId = inTransaction(() -> {
      var entity = new UserEntity();
      entity.setEmail(UUID.randomUUID() + "@example.test");
      entity.setTheme("cloud");
      entity.setTimezone("Europe/Berlin");
      entity.markCreatedAt(initialCreatedAt);
      entity.setUpdatedAt(initialUpdatedAt);
      entity.persist();
      return entity.getId();
    });

    inTransaction(() -> preferencesService.updateUserPreferences(
        userId,
        new UpdatePreferencesRequest("matrix", "America/New_York")
    ));

    UserEntity stored = inTransaction(() -> UserEntity.<UserEntity>findById(userId));

    assertEquals(initialCreatedAt, stored.createdAtValue());
    assertTrue(stored.updatedAtValue().isAfter(initialUpdatedAt));
  }

  @Test
  void shouldKeepRefreshTokenCreatedAtStableAndAdvanceUpdatedAtWhenRevoked() throws Exception {
    var initialCreatedAt = Instant.parse("2026-04-09T08:00:00Z");
    var initialUpdatedAt = Instant.parse("2026-04-09T08:05:00Z");
    var userId = inTransaction(() -> {
      var entity = new UserEntity();
      entity.setEmail(UUID.randomUUID() + "@example.test");
      entity.setTheme("cloud");
      entity.persist();
      return entity.getId();
    });
    var token = "refresh-" + UUID.randomUUID();

    inTransaction(() -> {
      var entity = new RefreshTokenEntity();
      entity.setToken(token);
      entity.setUserId(userId);
      entity.setRevoked(false);
      entity.setCreatedAt(initialCreatedAt);
      entity.setUpdatedAt(initialUpdatedAt);
      entity.setExpiry(Instant.parse("2026-05-09T08:00:00Z"));
      entity.persist();
    });

    inTransaction(() -> refreshTokenService.revoke(token));

    RefreshTokenEntity stored = inTransaction(() -> RefreshTokenEntity.<RefreshTokenEntity>find("token", token).firstResult());

    assertEquals(initialCreatedAt, stored.createdAtValue());
    assertTrue(stored.updatedAtValue().isAfter(initialUpdatedAt));
    assertTrue(stored.isRevoked());
  }

  @Test
  void shouldReadAndUpdatePreferencesThroughRealPersistenceService() throws Exception {
    var user = inTransaction(() -> {
      var entity = new UserEntity();
      entity.setEmail(UUID.randomUUID() + "@example.test");
      entity.setTheme("unsupported-theme");
      entity.setTimezone("Europe/Berlin");
      entity.markCreatedAt(Instant.now());
      entity.persist();
      return entity;
    });

    var current = inTransaction(() -> preferencesService.getUserPreferences(user.getId()));
    var updated = inTransaction(() -> preferencesService.updateUserPreferences(
        user.getId(),
        new UpdatePreferencesRequest("matrix", " ")
    ));
    var unchangedTimezone = inTransaction(() -> preferencesService.updateUserPreferences(
        user.getId(),
        new UpdatePreferencesRequest("matrix", null)
    ));

    assertEquals("cloud", current.theme());
    assertEquals("Europe/Berlin", current.timezone());
    assertEquals("matrix", updated.theme());
    assertNull(updated.timezone());
    assertNull(unchangedTimezone.timezone());
  }
}
