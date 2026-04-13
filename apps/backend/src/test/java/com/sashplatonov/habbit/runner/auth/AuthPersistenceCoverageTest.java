package com.sashplatonov.habbit.runner.auth;

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

    assertNotNull(created.id);
    assertEquals(email, created.email);
    assertEquals("cloud", created.theme);
    assertEquals(created.id, found.id);
    assertEquals(1L, UserEntity.count("email", email));
  }

  @Test
  void shouldCreateRequireAndRevokeRefreshTokensThroughRealPersistenceService() throws Exception {
    var user = inTransaction(() -> {
      var entity = new UserEntity();
      entity.email = UUID.randomUUID() + "@example.test";
      entity.theme = "cloud";
      entity.persist();
      return entity;
    });

    var token = "refresh-" + UUID.randomUUID();
    var createdToken = inTransaction(() -> refreshTokenService.create(token, user.id, 30));
    var active = inTransaction(() -> refreshTokenService.requireActive(token));
    inTransaction(() -> refreshTokenService.revoke(token));
    RefreshTokenEntity stored = inTransaction(() -> {
      var q = RefreshTokenEntity.<RefreshTokenEntity>find("token", token);
      return q.firstResult();
    });

    assertEquals(token, createdToken);
    assertEquals(token, active.token);
    assertEquals(user.id, stored.userId);
    assertTrue(stored.revoked);
    assertThrows(NotAuthorizedException.class, () -> inTransaction(() -> refreshTokenService.requireActive(token)));
  }

  @Test
  void shouldReadAndUpdatePreferencesThroughRealPersistenceService() throws Exception {
    var user = inTransaction(() -> {
      var entity = new UserEntity();
      entity.email = UUID.randomUUID() + "@example.test";
      entity.theme = "unsupported-theme";
      entity.timezone = "Europe/Berlin";
      entity.markCreatedAt(Instant.now());
      entity.persist();
      return entity;
    });

    var current = inTransaction(() -> preferencesService.getUserPreferences(user.id));
    var updated = inTransaction(() -> preferencesService.updateUserPreferences(
        user.id,
        new UpdatePreferencesRequest("matrix", " ")
    ));
    var unchangedTimezone = inTransaction(() -> preferencesService.updateUserPreferences(
        user.id,
        new UpdatePreferencesRequest("matrix", null)
    ));

    assertEquals("cloud", current.theme());
    assertEquals("Europe/Berlin", current.timezone());
    assertEquals("matrix", updated.theme());
    assertNull(updated.timezone());
    assertNull(unchangedTimezone.timezone());
  }
}