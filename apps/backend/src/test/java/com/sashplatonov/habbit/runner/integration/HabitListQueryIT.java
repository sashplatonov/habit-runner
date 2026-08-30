package com.sashplatonov.habbit.runner.integration;

import com.sashplatonov.habbit.runner.habit.HabitService;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.model.UserEntity;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import org.hibernate.Session;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
@TestProfile(PostgresTestProfile.class)
class HabitListQueryIT {
  @Inject
  EntityManager entityManager;

  @Inject
  HabitService habitService;

  @Test
  @TestTransaction
  void shouldBatchElementCollectionsForHabitList() {
    var user = new UserEntity();
    user.setId("query-user");
    user.setEmail("query-user@integration.test");
    user.setTheme("cloud");
    entityManager.persist(user);
    for (var index = 1; index <= 3; index++) {
      var habit = new HabitEntity();
      habit.setId("query-habit-" + index);
      habit.setUserId(user.getId());
      habit.setName("Habit " + index);
      habit.setColor(HabitColor.BLUE);
      habit.setIcon("star");
      habit.setFrequency(HabitFrequency.DAILY);
      habit.setTargetStreak(1);
      habit.setDailyTarget(1);
      habit.setType(HabitType.POSITIVE);
      habit.setSortOrder(BigInteger.valueOf(index));
      habit.setCustomDays(List.of());
      habit.setTags(List.of("tag-" + index));
      habit.setFreezeDays(List.of());
      habit.setScheduleWeekdays(List.of());
      habit.setScheduleWeeksOfMonth(List.of());
      entityManager.persist(habit);
    }
    entityManager.flush();
    entityManager.clear();

    var statistics = entityManager.unwrap(Session.class).getSessionFactory().getStatistics();
    statistics.clear();
    var response = habitService.findAll(user.getId());

    assertEquals(3, response.size());
    assertTrue(statistics.getCollectionLoadCount() <= 10,
        "element collections should load in batches; observed " + statistics.getCollectionLoadCount());
  }
}
