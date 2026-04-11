package com.habittracker.sync;

import com.habittracker.model.CheckinEntity;
import com.habittracker.model.HabitColor;
import com.habittracker.model.HabitEntity;
import com.habittracker.model.HabitFrequency;
import com.habittracker.model.HabitType;
import com.habittracker.model.UserEntity;
import com.habittracker.support.AuthenticatedApiTestSupport;
import com.habittracker.sync.dto.PushRequestDto;
import com.habittracker.sync.dto.SyncOpDto;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.IntStream;

import static io.restassured.RestAssured.given;
import static com.habittracker.sync.SyncTestPayloads.syncOp;
import static org.hamcrest.Matchers.*;

@QuarkusTest
@SuppressWarnings({"PMD.TooManyMethods", "PMD.LawOfDemeter"})
class SyncResourceTest extends AuthenticatedApiTestSupport {

  private String userId;
  private String token;

  @BeforeEach
  void setUp() throws Exception {
    var user = createAuthenticatedUser("cloud");
    userId = user.id();
    token = user.accessToken();
  }

  private HabitEntity createHabit(String habitId, String userId, int version, Instant updatedAt) throws Exception {
    ut.begin();
    var habit = new HabitEntity();
    habit.id = habitId;
    habit.userId = userId;
    habit.name = "Test Habit";
    habit.frequency = HabitFrequency.DAILY;
    habit.color = HabitColor.LEGACY_NORD;
    habit.icon = "star";
    habit.targetStreak = 0;
    habit.dailyTarget = 1;
    habit.archived = false;
    habit.setSortOrder(BigInteger.ZERO);
    habit.reminderEnabled = false;
    habit.type = HabitType.POSITIVE;
    habit.version = version;
    habit.setCreatedAt(updatedAt);
    habit.setUpdatedAt(updatedAt);
    habit.persist();
    ut.commit();
    return habit;
  }

  // ─── Pull tests ───────────────────────────────────────────────────────────

  @Test
  void shouldReturnEmptySyncPayloadWhenPullRequestedWithoutCursor() {
    given()
        .header("Authorization", "Bearer " + token)
        .queryParam("since", "")
        .when()
        .get("/sync/pull")
        .then()
        .statusCode(200)
        .header("x-sync-duration-ms", not(isEmptyOrNullString()))
        .header("Server-Timing", containsString("dur="))
        .body("habits", hasSize(0))
        .body("checkins", hasSize(0))
        .body("tombstones", hasSize(0))
        .body("nextCursor", notNullValue())
        .body("serverTime", notNullValue());
  }

  @Test
  void shouldReturnTraceIdHeaderWhenPullRequestedWithClientHeader() {
    given()
        .header("Authorization", "Bearer " + token)
        .header("x-trace-id", "trace-client-123")
        .when()
        .get("/sync/pull")
        .then()
        .statusCode(200)
        .header("x-trace-id", not(isEmptyOrNullString()));
  }

  @Test
  void shouldReturnHabitsWhenPullRequestedAfterMatchingChanges() throws Exception {
    var habitId = UUID.randomUUID().toString();
    createHabit(habitId, userId, 1, Instant.now().minus(1, ChronoUnit.MINUTES));

    given()
        .header("Authorization", "Bearer " + token)
        .when()
        .get("/sync/pull")
        .then()
        .statusCode(200)
        .body("habits", hasSize(1))
        .body("habits[0].id", equalTo(habitId));
  }

  @Test
  void shouldReturnNoHabitsWhenPullCursorIsAfterLatestChange() throws Exception {
    var habitId = UUID.randomUUID().toString();
    createHabit(habitId, userId, 1, Instant.now().minus(1, ChronoUnit.HOURS));

    // Use a cursor representing a time after the habit was created (JSON format)
    var futureTime = Instant.now().plus(1, ChronoUnit.MINUTES).toString();
    var futureCursor = "{\"updatedAt\":\"" + futureTime + "\",\"id\":\"zzz\"}";

    given()
        .header("Authorization", "Bearer " + token)
        .queryParam("since", futureCursor)
        .when()
        .get("/sync/pull")
        .then()
        .statusCode(200)
        .body("habits", hasSize(0));
  }

  @Test
  void shouldReturn401WhenPullRequestedWithoutAccessToken() {
    given()
        .when()
        .get("/sync/pull")
        .then()
        .statusCode(401)
        .header("x-trace-id", not(isEmptyOrNullString()))
        .body("status", equalTo(401))
          .body("message", equalTo("Unauthorized"))
        .body("timestamp", notNullValue());
  }

  // ─── Push tests ───────────────────────────────────────────────────────────

  @Test
  void shouldApplyHabitCreateAndExposeItOnNextPullWhenPushContainsUpsert() {
    var opId = UUID.randomUUID().toString();
    var habitId = UUID.randomUUID().toString();

    var op = syncOp(
      opId,
      "habit",
      "upsert",
      Map.of(
        "id", habitId,
        "name", "Push Habit",
        "frequency", "daily",
        "version", 1,
        "updatedAt", Instant.now().toString()
      ),
      Instant.now().toString()
    );

    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(pushRequest(op))
        .when()
        .post("/sync/push")
        .then()
        .statusCode(200)
        .header("x-sync-duration-ms", not(isEmptyOrNullString()))
        .header("Server-Timing", containsString("dur="))
        .body("applied", hasItem(opId))
        .body("conflicts", hasSize(0))
        .body("habits.id", hasItem(habitId))
        .body("checkins", hasSize(0))
        .body("tombstones", hasSize(0))
        .body("nextCursor", notNullValue());

    // It should appear in a subsequent pull
    given()
        .header("Authorization", "Bearer " + token)
        .when()
        .get("/sync/pull")
        .then()
        .statusCode(200)
        .body("habits.id", hasItem(habitId));
  }

  @Test
  void shouldIgnoreDuplicateOpIdWhenSamePushOperationSubmittedTwice() {
    var opId = UUID.randomUUID().toString();
    var habitId = UUID.randomUUID().toString();

    var op = syncOp(
      opId,
      "habit",
      "upsert",
      Map.of(
        "id", habitId,
        "name", "Dedup Habit",
        "frequency", "daily",
        "version", 1,
        "updatedAt", Instant.now().toString()
      ),
      Instant.now().toString()
    );
    var request = PushRequestDto.builder().ops(List.of(op)).build();

    // First push — should be applied
    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(request)
        .when()
        .post("/sync/push")
        .then()
        .statusCode(200)
        .body("applied", hasItem(opId));

    // Second push with same opId — should NOT appear in applied (already logged)
    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(request)
        .when()
        .post("/sync/push")
        .then()
        .statusCode(200)
        .body("applied", not(hasItem(opId)));
  }

  @Test
  void shouldReturnConflictWhenHabitPushUsesOlderVersion() throws Exception {
    var habitId = UUID.randomUUID().toString();
    // Seed server with version 5
    createHabit(habitId, userId, 5, Instant.now().minus(5, ChronoUnit.MINUTES));

    // Client tries to push version 3 (older) with an older timestamp
    var opId = UUID.randomUUID().toString();
    var op = syncOp(
      opId,
      "habit",
      "upsert",
      Map.of(
        "id", habitId,
        "name", "Client Habit",
        "frequency", "daily",
        "version", 3,
        "updatedAt", Instant.now().minus(10, ChronoUnit.MINUTES).toString()
      ),
      Instant.now().toString()
    );

    assertPushConflict(op, opId);
  }

  @Test
  void shouldCreateTombstoneAndRemoveHabitWhenDeleteOperationSubmitted() throws Exception {
    var habitId = UUID.randomUUID().toString();
    createHabit(habitId, userId, 1, Instant.now().minus(1, ChronoUnit.MINUTES));

    ut.begin();
    var checkin = new CheckinEntity();
    checkin.id = UUID.randomUUID().toString();
    checkin.habitId = habitId;
    checkin.userId = userId;
    checkin.setCheckinDate(LocalDate.of(2025, 1, 1));
    checkin.done = true;
    checkin.count = 1;
    checkin.version = 1;
    checkin.setAuditTimestamps(Instant.now(), Instant.now());
    checkin.persist();
    ut.commit();

    var opId = UUID.randomUUID().toString();
    var op = syncOp(
      opId,
      "habit",
      "delete",
      Map.of("id", habitId, "version", 2),
      Instant.now().toString()
    );

    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(pushRequest(op))
        .when()
        .post("/sync/push")
        .then()
        .statusCode(200)
        .body("applied", hasItem(opId))
        .body("tombstones.entityId", hasItem(habitId))
        .body("nextCursor", notNullValue());

    // Habit should not appear in subsequent pull
    given()
        .header("Authorization", "Bearer " + token)
        .when()
        .get("/sync/pull")
        .then()
        .statusCode(200)
        .body("habits.id", not(hasItem(habitId)))
        .body("tombstones.entityId", hasItem(habitId));
  }

  @Test
  void shouldReturnConflictWhenCheckinTargetsHabitOwnedByAnotherUser() throws Exception {
    var otherUserId = UUID.randomUUID().toString();
    ut.begin();
    var other = new UserEntity();
    other.id = otherUserId;
    other.email = otherUserId + "@test.com";
    other.theme = "cloud";
    other.markCreatedAt(Instant.now());
    other.persist();
    ut.commit();

    var habitId = UUID.randomUUID().toString();
    createHabit(habitId, otherUserId, 1, Instant.now());

    // Our user tries to push a checkin to the other user's habit
    var opId = UUID.randomUUID().toString();
    var op = syncOp(
      opId,
      "checkin",
      "upsert",
      Map.of(
        "id", UUID.randomUUID().toString(),
        "habitId", habitId,
        "date", "2025-01-01",
        "done", true,
        "version", 1,
        "updatedAt", Instant.now().toString()
      ),
      Instant.now().toString()
    );

    assertPushConflict(op, opId);
  }

  @Test
  void shouldReturn401WhenPushRequestedWithoutAccessToken() {
    given()
        .contentType(ContentType.JSON)
        .body(pushRequest())
        .when()
        .post("/sync/push")
        .then()
        .statusCode(401);
  }

  private PushRequestDto pushRequest(SyncOpDto... ops) {
    return PushRequestDto.builder().ops(List.of(ops)).build();
  }

  private void assertPushConflict(SyncOpDto op, String opId) {
    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(pushRequest(op))
        .when()
        .post("/sync/push")
        .then()
        .statusCode(200)
        .body("applied", not(hasItem(opId)))
        .body("conflicts", hasSize(1))
        .body("conflicts[0].opId", equalTo(opId));
  }

  // ─── Guardrail tests ──────────────────────────────────────────────────────

  @Test
  void shouldReturn422WhenPushPayloadExceedsMaxOpCount() {
    var ops = IntStream.range(0, 501).mapToObj(i -> syncOp(
        UUID.randomUUID().toString(),
        "habit",
        "upsert",
        Map.of("id", UUID.randomUUID().toString(), "name", "Habit " + i,
            "frequency", "daily", "version", 1, "updatedAt", Instant.now().toString()),
        Instant.now().toString()
    )).toList();

    given()
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .body(PushRequestDto.builder().ops(ops).build())
        .when()
        .post("/sync/push")
        .then()
        .statusCode(422)
        .body("status", equalTo(422))
        .body("message", containsString("500"))
        .body("traceId", notNullValue());
  }

  // ─── Cursor pagination tests ──────────────────────────────────────────────

  @Test
  void shouldReturnOnlyNewerHabitWhenPullUsesExactCursorOfOlderHabit() throws Exception {
    var t1 = Instant.now().minus(2, ChronoUnit.MINUTES);
    var t2 = Instant.now().minus(1, ChronoUnit.MINUTES);
    var habit1Id = UUID.randomUUID().toString();
    var habit2Id = UUID.randomUUID().toString();
    createHabit(habit1Id, userId, 1, t1);
    createHabit(habit2Id, userId, 2, t2);

    // Cursor points to the first habit — pull should return only habit2
    var cursor = "{\"updatedAt\":\"" + t1.toString() + "\",\"id\":\"" + habit1Id + "\"}";

    given()
        .header("Authorization", "Bearer " + token)
        .queryParam("since", cursor)
        .when()
        .get("/sync/pull")
        .then()
        .statusCode(200)
        .body("habits", hasSize(1))
        .body("habits[0].id", equalTo(habit2Id));
  }

  @Test
  void shouldReturnAllHabitsWhenPullCursorIsMalformed() throws Exception {
    var habitId = UUID.randomUUID().toString();
    createHabit(habitId, userId, 1, Instant.now().minus(1, ChronoUnit.MINUTES));

    given()
        .header("Authorization", "Bearer " + token)
        .queryParam("since", "not-valid-json-cursor")
        .when()
        .get("/sync/pull")
        .then()
        .statusCode(200)
        .body("habits.id", hasItem(habitId));
  }
}
