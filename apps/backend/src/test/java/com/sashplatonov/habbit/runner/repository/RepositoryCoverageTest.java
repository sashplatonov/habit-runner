package com.sashplatonov.habbit.runner.repository;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.model.OAuthStateEntity;
import com.sashplatonov.habbit.runner.model.PushSubscriptionEntity;
import com.sashplatonov.habbit.runner.model.RefreshTokenEntity;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.auth.support.RefreshTokenDigest;
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

  @Test
  void shouldCoverUserAndAuthRepositories() throws Exception {
    var email = UUID.randomUUID() + "@example.test";
    var stateId = "state-" + UUID.randomUUID();
    var refreshToken = "refresh-" + UUID.randomUUID();
    var endpoint = "https://push.example/" + UUID.randomUUID();

    inTransaction(() -> {
      var user = new UserEntity();
      user.setEmail(email);
      userRepository.save(user);

      var state = new OAuthStateEntity();
      state.state = stateId;
      state.returnTo = "https://client.example.test";
      state.setExpiry(Instant.now().plusSeconds(600));
      oAuthStateRepository.save(state);

      var refresh = new RefreshTokenEntity();
      refresh.setTokenHash(RefreshTokenDigest.hash(refreshToken));
      refresh.setUserId(user.getId());
      refresh.setRevoked(false);
      refresh.setExpiresAt(Instant.now().plusSeconds(600));
      refreshTokenRepository.save(refresh);

      var subscription = new PushSubscriptionEntity();
      subscription.setUserId(user.getId());
      subscription.setEndpoint(endpoint);
      subscription.setP256dh("p256dh");
      subscription.setAuth("auth");
      pushSubscriptionRepository.save(subscription);

      assertNotNull(userRepository.findByEmail(email));
      assertNotNull(userRepository.findRequiredById(user.getId()));
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

    inTransaction(() -> {
      var firstHabit = new HabitEntity();
      firstHabit.setId(UUID.randomUUID().toString());
      firstHabit.setUserId(userId);
      firstHabit.setName("Morning Run");
      firstHabit.setFrequency(HabitFrequency.DAILY);
      firstHabit.setColor(HabitColor.BLUE);
      firstHabit.setIcon("run");
      firstHabit.setDailyTarget(1);
      firstHabit.setTargetStreak(0);
      firstHabit.setArchived(false);
      firstHabit.setType(HabitType.POSITIVE);
      firstHabit.setVersion(1);
      firstHabit.setSortOrder(BigInteger.ZERO);
      firstHabit.setCreatedAt(firstUpdatedAt);
      firstHabit.setUpdatedAt(firstUpdatedAt);
      habitRepository.save(firstHabit);

      var secondHabit = new HabitEntity();
      secondHabit.setId(UUID.randomUUID().toString());
      secondHabit.setUserId(userId);
      secondHabit.setName("Evening Read");
      secondHabit.setFrequency(HabitFrequency.DAILY);
      secondHabit.setColor(HabitColor.GREEN);
      secondHabit.setIcon("book");
      secondHabit.setDailyTarget(1);
      secondHabit.setTargetStreak(0);
      secondHabit.setArchived(false);
      secondHabit.setType(HabitType.POSITIVE);
      secondHabit.setVersion(2);
      secondHabit.setSortOrder(BigInteger.ONE);
      secondHabit.setCreatedAt(secondUpdatedAt);
      secondHabit.setUpdatedAt(secondUpdatedAt);
      habitRepository.save(secondHabit);

      assertNotNull(habitRepository.findHabitById(firstHabit.getId()));
      assertEquals(2, habitRepository.findPageForUser(userId, null, null, 10).size());
      assertEquals(1, habitRepository.findPageForUser(userId, firstUpdatedAt, firstHabit.getId(), 10).size());

      var firstCheckin = new CheckinEntity();
      firstCheckin.setId(UUID.randomUUID().toString());
      firstCheckin.setHabitId(firstHabit.getId());
      firstCheckin.setUserId(userId);
      firstCheckin.setCheckinDate(LocalDate.of(2026, 4, 10));
      firstCheckin.setDone(true);
      firstCheckin.setCount(1);
      firstCheckin.setVersion(1);
      firstCheckin.setAuditTimestamps(firstUpdatedAt, firstUpdatedAt);
      checkinRepository.save(firstCheckin);

      var secondCheckin = new CheckinEntity();
      secondCheckin.setId(UUID.randomUUID().toString());
      secondCheckin.setHabitId(firstHabit.getId());
      secondCheckin.setUserId(userId);
      secondCheckin.setCheckinDate(LocalDate.of(2026, 4, 11));
      secondCheckin.setDone(true);
      secondCheckin.setCount(1);
      secondCheckin.setVersion(2);
      secondCheckin.setAuditTimestamps(secondUpdatedAt, secondUpdatedAt);
      checkinRepository.save(secondCheckin);

      assertNotNull(checkinRepository.findByHabitDateAndUserId(firstHabit.getId(), LocalDate.of(2026, 4, 10), userId));
      assertEquals(2, checkinRepository.findPageForUser(userId, null, null, 10).size());
      assertEquals(1, checkinRepository.findPageForUser(userId, firstUpdatedAt, firstCheckin.getId(), 10).size());
      assertEquals(1L, checkinRepository.deleteByHabitIdUserIdAndDate(firstHabit.getId(), userId, LocalDate.of(2026, 4, 10)));
      assertEquals(1L, checkinRepository.deleteByHabitIdAndUserId(firstHabit.getId(), userId));
      assertEquals(1L, habitRepository.deleteByIdAndUserId(secondHabit.getId(), userId));
    });
  }
}
