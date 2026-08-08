package com.sashplatonov.habbit.runner.integration;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
@TestProfile(PostgresTestProfile.class)
class FlywayMigrationIT {
  @Inject
  EntityManager entityManager;

  @Inject
  Flyway flyway;

  @Test
  void shouldApplyEveryMigrationToFreshPostgres() {
    var appliedVersions = entityManager.createNativeQuery(
        "SELECT version FROM flyway_schema_history WHERE success = TRUE ORDER BY installed_rank"
    ).getResultList();

    var expectedMigrationCount = Arrays.stream(flyway.info().all())
        .filter(migration -> migration.getVersion() != null)
        .count();

    assertEquals(expectedMigrationCount, appliedVersions.size());
    assertEquals("12", appliedVersions.getLast().toString());
  }

  @Test
  void shouldPreserveConvertedHabitStorageAndCursorIndexes() {
    var scheduleType = entityManager.createNativeQuery(
        "SELECT data_type FROM information_schema.columns "
            + "WHERE table_schema = 'public' AND table_name = 'habits' AND column_name = 'schedule'"
    ).getSingleResult();
    var cursorIndexCount = ((Number) entityManager.createNativeQuery(
        "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' "
            + "AND indexname IN ('habits_user_updated_cursor_idx', 'checkins_user_updated_cursor_idx')"
    ).getSingleResult()).intValue();
    var dashboardPreferencesType = entityManager.createNativeQuery(
        "SELECT data_type FROM information_schema.columns "
            + "WHERE table_schema = 'public' AND table_name = 'users' "
            + "AND column_name = 'dashboardPreferences'"
    ).getSingleResult();

    assertEquals("text", scheduleType);
    assertEquals(2, cursorIndexCount);
    assertEquals("text", dashboardPreferencesType);
    assertTrue(tableExists("habit_schedule_weekdays"));
  }

  private boolean tableExists(String tableName) {
    return ((Number) entityManager.createNativeQuery(
        "SELECT COUNT(*) FROM information_schema.tables "
            + "WHERE table_schema = 'public' AND table_name = ?1"
    ).setParameter(1, tableName).getSingleResult()).intValue() == 1;
  }
}
