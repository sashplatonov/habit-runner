package com.sashplatonov.habbit.runner.model;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthModelEntityTest {

  @Test
  void shouldInitializeUserDefaultsWhenPrePersistRunsWithoutIdOrTheme() {
    var user = new UserEntity();

    runPrePersist(user);

    assertNotNull(user.id);
    assertEquals("cloud", user.theme);
    assertNotNull(user.createdAt);
    assertNotNull(user.updatedAt);
    assertEquals(user.createdAt, user.updatedAt);
  }

  @Test
  void shouldPreserveExplicitCreatedAtWhenUserMarkedCreatedAt() {
    var createdAt = Instant.parse("2026-04-09T12:00:00Z");
    var user = new UserEntity();

    user.markCreatedAt(createdAt);
    runPrePersist(user);

    assertEquals(createdAt, user.createdAt);
    assertEquals(createdAt, user.updatedAt);
  }

  @Test
  void shouldTouchUserUpdatedAtWithoutChangingCreatedAtWhenAuditUpdateRuns() {
    var createdAt = Instant.parse("2026-04-09T12:00:00Z");
    var user = new UserEntity();

    user.markCreatedAt(createdAt);
    runPrePersist(user);

    user.theme = "matrix";
    user.preUpdateAudit();

    var updatedAt = user.updatedAtValue();

    assertEquals(createdAt, user.createdAt);
    assertTrue(updatedAt.isAfter(createdAt));
  }

  @Test
  void shouldInitializeRefreshTokenDefaultsAndRemainActiveWhenNotRevoked() {
    var token = new RefreshTokenEntity();
    token.token = "refresh-token";
    token.setExpiry(Instant.now().plusSeconds(60));

    runPrePersist(token);

    assertNotNull(token.id);
    assertNotNull(token.createdAt);
    assertNotNull(token.updatedAt);
    assertEquals(token.createdAt, token.updatedAt);
    assertTrue(token.isActiveAt(Instant.now()));
  }

  @Test
  void shouldRevokeRefreshTokenAndExposeTokenValueWhenRequested() {
    var token = new RefreshTokenEntity();
    token.token = "refresh-token";
    token.setExpiry(Instant.now().minusSeconds(60));

    token.revoke();

    assertTrue(token.revoked);
    assertFalse(token.isActiveAt(Instant.now()));
    assertEquals("refresh-token", token.tokenValue());
  }

  @Test
  void shouldInitializePushSubscriptionDefaultsWhenPrePersistRuns() {
    var subscription = new PushSubscriptionEntity();

    runPrePersist(subscription);

    assertNotNull(subscription.id);
    assertNotNull(subscription.createdAt);
    assertNotNull(subscription.updatedAt);
    assertEquals(subscription.createdAt, subscription.updatedAt);
    assertNull(subscription.endpoint);
  }

  @Test
  void shouldTrackOauthStateExpiryWhenExpiryUpdated() {
    var state = new OAuthStateEntity();

    state.setExpiry(Instant.parse("2026-04-09T12:00:00Z"));
    runPrePersist(state);

    assertFalse(state.isExpiredAt(Instant.parse("2026-04-09T11:59:59Z")));
    assertTrue(state.isExpiredAt(Instant.parse("2026-04-09T12:00:01Z")));
    assertNotNull(state.createdAt);
    assertNotNull(state.updatedAt);
    assertEquals(state.createdAt, state.updatedAt);
  }

  private void runPrePersist(UserEntity entity) {
    entity.prePersistAudit();
    entity.prePersistUuidId();
    entity.prePersist();
  }

  private void runPrePersist(RefreshTokenEntity entity) {
    entity.prePersistAudit();
    entity.prePersistUuidId();
  }

  private void runPrePersist(PushSubscriptionEntity entity) {
    entity.prePersistAudit();
    entity.prePersistUuidId();
  }

  private void runPrePersist(OAuthStateEntity entity) {
    entity.prePersistAudit();
  }
}
