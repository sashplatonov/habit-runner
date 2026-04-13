package com.sashplatonov.habbit.runner.repository;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import com.sashplatonov.habbit.runner.model.PushSubscriptionEntity;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.model.TombstoneEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.support.AuthenticatedApiTestSupport;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class RepositoryCoverageTest extends AuthenticatedApiTestSupport {

  @Inject
  UserRepository userRepository;

  @Inject
  OAuthStateRepository oAuthStateRepository;

  @Inject
  RefreshTokenRepository refreshTokenRepository;

  @Inject
  PushSubscriptionRepository pushSubscriptionRepository;

  @Inject
  HabitRepository habitRepository;

  @Inject
  CheckinRepository checkinRepository;

  @Inject
  TombstoneRepository tombstoneRepository;

  @Test
  void shouldCoverUserAndAuthRepositories() throws Exception {
    var email = UUID.randomUUID() + "@example.test";
    var stateId = "state-" + UUID.randomUUID();
    var refreshToken = "refresh-" + UUID.randomUUID();
    var endpoint = "https://push.example/" + UUID.randomUUID();

    inTransaction(() -> {
      var user = new UserEntity();
      user.email = email;
      userRepository.save(user);

      var state = new OAuthStateEntity();
      state.state = stateId;
      state.returnTo = "https://client.example.test";
      state.setExpiry(Instant.now().plusSeconds(600));
      oAuthStateRepository.save(state);

      var refresh = new RefreshTokenEntity();
      refresh.token = refreshToken;
      refresh.userId = user.id;
      refresh.revoked = false;
      refresh.setExpiry(Instant.now().plusSeconds(600));
      refreshTokenRepository.save(refresh);

      var subscription = new PushSubscriptionEntity();
      subscription.userId = user.id;
      subscription.endpoint = endpoint;
      subscription.p256dh = "p256dh";
      subscription.auth = "auth";
      pushSubscriptionRepository.save(subscription);

      assertNotNull(userRepository.findByEmail(email));
      assertNotNull(userRepository.findRequiredById(user.id));
      assertNotNull(oAuthStateRepository.findById(stateId));
      assertNotNull(refreshTokenRepository.findByToken(refreshToken));
      assertNotNull(pushSubscriptionRepository.findByEndpoint(endpoint));
      assertTrue(oAuthStateRepository.deleteState(stateId));
      assertEquals(1L, pushSubscriptionRepository.deleteByEndpoint(endpoint));
    });
  }

  @Test
  void shouldCoverSyncRepositories() throws Exception {
    var userId = UUID.randomUUID().toString();
    var firstUpdatedAt = Instant.parse("2026-04-10T10:00:00Z");
    var secondUpdatedAt = Instant.parse("2026-04-10T10:05:00Z");
    var firstDeletedAt = Instant.parse("2026-04-10T10:10:00Z");
    var secondDeletedAt = Instant.parse("2026-04-10T10:15:00Z");

    inTransaction(() -> {
      var firstHabit = new HabitEntity();
      firstHabit.id = UUID.randomUUID().toString();
      firstHabit.userId = userId;
      firstHabit.name = "Morning Run";
      firstHabit.setFrequency(HabitFrequency.DAILY);
      firstHabit.setColor(HabitColor.BLUE);
      firstHabit.icon = "run";
      firstHabit.dailyTarget = 1;
      firstHabit.targetStreak = 0;
      firstHabit.archived = false;
      firstHabit.setType(HabitType.POSITIVE);
      firstHabit.version = 1;
      firstHabit.setSortOrder(BigInteger.ZERO);
      firstHabit.setCreatedAt(firstUpdatedAt);
      firstHabit.setUpdatedAt(firstUpdatedAt);
      habitRepository.save(firstHabit);

      var secondHabit = new HabitEntity();
      secondHabit.id = UUID.randomUUID().toString();
      secondHabit.userId = userId;
      secondHabit.name = "Evening Read";
      secondHabit.setFrequency(HabitFrequency.DAILY);
      secondHabit.setColor(HabitColor.GREEN);
      secondHabit.icon = "book";
      secondHabit.dailyTarget = 1;
      secondHabit.targetStreak = 0;
      secondHabit.archived = false;
      secondHabit.setType(HabitType.POSITIVE);
      secondHabit.version = 2;
      secondHabit.setSortOrder(BigInteger.ONE);
      secondHabit.setCreatedAt(secondUpdatedAt);
      secondHabit.setUpdatedAt(secondUpdatedAt);
      habitRepository.save(secondHabit);

      assertNotNull(habitRepository.findHabitById(firstHabit.id));
      assertEquals(2, habitRepository.findPageForUser(userId, null, null, 10).size());
      assertEquals(1, habitRepository.findPageForUser(userId, firstUpdatedAt, firstHabit.id, 10).size());

      var firstCheckin = new CheckinEntity();
      firstCheckin.id = UUID.randomUUID().toString();
      firstCheckin.habitId = firstHabit.id;
      firstCheckin.userId = userId;
      firstCheckin.setCheckinDate(LocalDate.of(2026, 4, 10));
      firstCheckin.done = true;
      firstCheckin.count = 1;
      firstCheckin.version = 1;
      firstCheckin.setAuditTimestamps(firstUpdatedAt, firstUpdatedAt);
      checkinRepository.save(firstCheckin);

      var secondCheckin = new CheckinEntity();
      secondCheckin.id = UUID.randomUUID().toString();
      secondCheckin.habitId = firstHabit.id;
      secondCheckin.userId = userId;
      secondCheckin.setCheckinDate(LocalDate.of(2026, 4, 11));
      secondCheckin.done = true;
      secondCheckin.count = 1;
      secondCheckin.version = 2;
      secondCheckin.setAuditTimestamps(secondUpdatedAt, secondUpdatedAt);
      checkinRepository.save(secondCheckin);

      assertNotNull(checkinRepository.findByHabitDateAndUserId(firstHabit.id, LocalDate.of(2026, 4, 10), userId));
      assertEquals(2, checkinRepository.findPageForUser(userId, null, null, 10).size());
      assertEquals(1, checkinRepository.findPageForUser(userId, firstUpdatedAt, firstCheckin.id, 10).size());
      assertEquals(1L, checkinRepository.deleteByHabitIdUserIdAndDate(firstHabit.id, userId, LocalDate.of(2026, 4, 10)));
      assertEquals(1L, checkinRepository.deleteByHabitIdAndUserId(firstHabit.id, userId));

      var firstTombstone = new TombstoneEntity();
      firstTombstone.userId = userId;
      firstTombstone.entity = "habit";
      firstTombstone.entityId = firstHabit.id;
      firstTombstone.version = 1;
      firstTombstone.setDeletedAt(firstDeletedAt);
      tombstoneRepository.save(firstTombstone);

      var secondTombstone = new TombstoneEntity();
      secondTombstone.userId = userId;
      secondTombstone.entity = "checkin";
      secondTombstone.entityId = secondHabit.id;
      secondTombstone.version = 2;
      secondTombstone.setDeletedAt(secondDeletedAt);
      tombstoneRepository.save(secondTombstone);

      assertEquals(2, tombstoneRepository.findPageForUser(userId, null, null, 10).size());
      assertEquals(1, tombstoneRepository.findPageForUser(userId, firstDeletedAt, firstTombstone.id, 10).size());
      assertEquals(1L, habitRepository.deleteByIdAndUserId(secondHabit.id, userId));
    });
  }
}