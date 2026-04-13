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

    user.prePersist();

    assertNotNull(user.id);
    assertEquals("cloud", user.theme);
    assertNotNull(user.createdAt);
  }

  @Test
  void shouldPreserveExplicitCreatedAtWhenUserMarkedCreatedAt() {
    var createdAt = Instant.parse("2026-04-09T12:00:00Z");
    var user = new UserEntity();

    user.markCreatedAt(createdAt);
    user.prePersist();

    assertEquals(createdAt, user.createdAt);
  }

  @Test
  void shouldInitializeRefreshTokenDefaultsAndRemainActiveWhenNotRevoked() {
    var token = new RefreshTokenEntity();
    token.token = "refresh-token";
    token.setExpiry(Instant.now().plusSeconds(60));

    token.prePersist();

    assertNotNull(token.id);
    assertNotNull(token.createdAt);
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

    subscription.prePersist();

    assertNotNull(subscription.id);
    assertNotNull(subscription.createdAt);
    assertNull(subscription.endpoint);
  }

  @Test
  void shouldTrackOauthStateExpiryWhenExpiryUpdated() {
    var state = new OAuthStateEntity();

    state.setExpiry(Instant.parse("2026-04-09T12:00:00Z"));
    state.prePersist();

    assertFalse(state.isExpiredAt(Instant.parse("2026-04-09T11:59:59Z")));
    assertTrue(state.isExpiredAt(Instant.parse("2026-04-09T12:00:01Z")));
    assertNotNull(state.createdAt);
  }
}