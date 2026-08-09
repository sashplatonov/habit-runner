package com.sashplatonov.habbit.runner.integration;

import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.auth.identity.AccountMergeService;
import com.sashplatonov.habbit.runner.auth.identity.AuthProvider;
import com.sashplatonov.habbit.runner.model.AuthIdentityEntity;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceException;
import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertNull;

@QuarkusTest
@TestProfile(PostgresTestProfile.class)
class PostgreSqlRepositoryIT {
  @Inject
  EntityManager entityManager;

  @Inject
  HabitRepository habitRepository;

  @Inject
  AccountMergeService accountMergeService;

  @Test
  @TestTransaction
  void shouldSortHabitsAndAdvanceThroughUpdatedCursor() {
    var user = user("user-sort");
    entityManager.persist(user);
    var first = habit("habit-first", user.getId(), BigInteger.ONE, Instant.parse("2026-01-01T00:00:00Z"));
    var second = habit("habit-second", user.getId(), BigInteger.TWO, Instant.parse("2026-01-02T00:00:00Z"));
    entityManager.persist(first);
    entityManager.persist(second);
    entityManager.flush();

    assertEquals(List.of("habit-first", "habit-second"), habitRepository.findListForUser(user.getId())
        .stream().map(HabitEntity::getId).toList());
    assertEquals(List.of("habit-second"), habitRepository
        .findSyncPageForUser(user.getId(), first.getUpdatedAt(), first.getId(), 10)
        .stream().map(HabitEntity::getId).toList());
  }

  @Test
  @TestTransaction
  void shouldRejectCheckinWithUnknownHabit() {
    var checkin = checkin("checkin-invalid", "missing-habit", "missing-user", LocalDate.of(2026, 1, 1));
    entityManager.persist(checkin);

    assertThrows(PersistenceException.class, entityManager::flush);
  }

  @Test
  @TestTransaction
  void shouldRejectDuplicateCheckinDateForHabit() {
    var user = user("user-unique");
    entityManager.persist(user);
    var habit = habit("habit-unique", user.getId(), BigInteger.ONE, Instant.now());
    entityManager.persist(habit);
    entityManager.persist(checkin("checkin-one", habit.getId(), user.getId(), LocalDate.of(2026, 1, 1)));
    entityManager.flush();
    entityManager.persist(checkin("checkin-two", habit.getId(), user.getId(), LocalDate.of(2026, 1, 1)));

    assertThrows(PersistenceException.class, entityManager::flush);
  }

  @Test
  @TestTransaction
  void shouldTransferIdentityAndRemoveAbsorbedUserDuringMerge() {
    var survivor = user("merge-survivor");
    var absorbed = user("merge-absorbed");
    entityManager.persist(survivor);
    entityManager.persist(absorbed);

    var identity = new AuthIdentityEntity();
    identity.setProvider(AuthProvider.TELEGRAM);
    identity.setProviderSubject("telegram-merge-absorbed");
    identity.setUserId(absorbed.getId());
    entityManager.persist(identity);
    entityManager.flush();

    accountMergeService.merge(survivor.getId(), absorbed.getId());
    entityManager.clear();

    assertEquals(survivor.getId(), AuthIdentityEntity.<AuthIdentityEntity>findAll().firstResult().getUserId());
    assertNull(UserEntity.findById(absorbed.getId()));
  }

  private UserEntity user(String id) {
    var user = new UserEntity();
    user.setId(id);
    user.setEmail(id + "@integration.test");
    user.setTheme("cloud");
    return user;
  }

  private HabitEntity habit(String id, String userId, BigInteger sortOrder, Instant updatedAt) {
    var habit = new HabitEntity();
    habit.setId(id);
    habit.setUserId(userId);
    habit.setName(id);
    habit.setColor(HabitColor.BLUE);
    habit.setIcon("star");
    habit.setFrequency(HabitFrequency.DAILY);
    habit.setTargetStreak(1);
    habit.setDailyTarget(1);
    habit.setType(HabitType.POSITIVE);
    habit.setSortOrder(sortOrder);
    habit.setAuditTimestamps(updatedAt, updatedAt);
    return habit;
  }

  private CheckinEntity checkin(String id, String habitId, String userId, LocalDate date) {
    var checkin = new CheckinEntity();
    checkin.setId(id);
    checkin.setHabitId(habitId);
    checkin.setUserId(userId);
    checkin.setCheckinDate(date);
    checkin.setDone(true);
    checkin.setCount(1);
    return checkin;
  }
}
