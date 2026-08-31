package com.sashplatonov.habbit.runner.auth;

import com.sashplatonov.habbit.runner.auth.support.RefreshTokenDigest;
import com.sashplatonov.habbit.runner.auth.dto.UpdatePreferencesRequest;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
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
