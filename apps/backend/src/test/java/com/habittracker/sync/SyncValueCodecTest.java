package com.habittracker.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.habittracker.model.HabitType;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class SyncValueCodecTest {

  private final SyncValueCodec codec = new SyncValueCodec();
  private final SyncPayloadCodec payloadCodec = new SyncPayloadCodec(new ObjectMapper());

  @Test
  void shouldNormalizeReminderTimeWhenValueValid() {
    assertEquals("09:30", codec.normalizeReminderTime("09:30"));
  }

  @Test
  void shouldReturnNullWhenReminderTimeMissingMalformedOrOutOfRange() {
    assertNull(codec.normalizeReminderTime(null));
    assertNull(codec.normalizeReminderTime("9:30"));
    assertNull(codec.normalizeReminderTime("24:00"));
    assertNull(codec.normalizeReminderTime("09:61"));
  }

  @Test
  void shouldNormalizeCustomDaysJsonWhenPayloadContainsDistinctWeekdays() {
    var normalized = codec.normalizeCustomDaysJson(List.of(2, 6, 2, 0, 9, -1), payloadCodec);

    assertEquals("[2,6,0]", normalized);
  }

  @Test
  void shouldReturnNullWhenCustomDaysPayloadHasNoValidWeekdays() {
    assertNull(codec.normalizeCustomDaysJson(List.of(8, 9, -1), payloadCodec));
    assertNull(codec.normalizeCustomDaysJson(null, payloadCodec));
  }

  @Test
  void shouldNormalizeFreezeDaysWhenPayloadContainsValidDates() {
    var normalized = codec.normalizeFreezeDaysJson(
        List.of("2026-04-11", "bad", "2026-04-10", "2026-04-11"),
        null,
        payloadCodec
    );

    assertEquals("[\"2026-04-10\",\"2026-04-11\"]", normalized);
  }

  @Test
  void shouldReturnExistingOrEmptyFreezeDaysWhenPayloadMissingOrInvalid() {
    assertEquals("[\"2026-04-10\"]", codec.normalizeFreezeDaysJson(null, "[\"2026-04-10\"]", payloadCodec));
    assertEquals("[]", codec.normalizeFreezeDaysJson(null, null, payloadCodec));
    assertEquals("[]", codec.normalizeFreezeDaysJson(List.of("bad-payload"), "[\"2026-04-10\"]", payloadCodec));
  }

  @Test
  void shouldResolveSortOrderAndDailyTargetWhenPayloadNumeric() {
    assertEquals(BigInteger.valueOf(5L), codec.resolveSortOrder(5, BigInteger.ZERO));
    assertEquals(BigInteger.TEN, codec.resolveSortOrder(null, BigInteger.TEN));
    assertEquals(BigInteger.ZERO, codec.resolveSortOrder(null, null));
    assertEquals(3, codec.resolveDailyTarget(3, 0));
    assertEquals(1, codec.resolveDailyTarget(0, 2));
    assertEquals(4, codec.resolveDailyTarget(null, 4));
  }

  @Test
  void shouldConvertStringValuesUsingHelperMethods() {
    assertEquals("value", codec.asString("value"));
    assertNull(codec.asString(" "));
    assertNull(codec.asString(null));
  }

  @Test
  void shouldNormalizeTypeWhenValueNegativeOrUnsupported() {
    assertEquals(HabitType.NEGATIVE, codec.normalizeType(HabitType.NEGATIVE));
    assertEquals(HabitType.POSITIVE, codec.normalizeType(HabitType.POSITIVE));
    assertEquals(HabitType.POSITIVE, codec.normalizeType(null));
  }
}