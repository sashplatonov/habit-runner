package com.habittracker.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
    var normalized = codec.normalizeCustomDaysJson(List.of(2, 6, 2, 0, 9, "bad"), payloadCodec);

    assertEquals("[2,6,0]", normalized);
  }

  @Test
  void shouldReturnNullWhenCustomDaysPayloadHasNoValidWeekdays() {
    assertNull(codec.normalizeCustomDaysJson(List.of(8, 9, "bad"), payloadCodec));
    assertNull(codec.normalizeCustomDaysJson("not-a-list", payloadCodec));
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
    assertEquals("[]", codec.normalizeFreezeDaysJson("bad-payload", "[\"2026-04-10\"]", payloadCodec));
  }

  @Test
  void shouldResolveSortOrderAndDailyTargetWhenPayloadNumeric() {
    assertEquals(BigInteger.valueOf(5L), codec.resolveSortOrder(5.8D, BigInteger.ZERO));
    assertEquals(BigInteger.TEN, codec.resolveSortOrder(null, BigInteger.TEN));
    assertEquals(BigInteger.ZERO, codec.resolveSortOrder(null, null));
    assertEquals(3, codec.resolveDailyTarget(3.9D, 0));
    assertEquals(1, codec.resolveDailyTarget(0, 2));
    assertEquals(4, codec.resolveDailyTarget(null, 4));
  }

  @Test
  void shouldConvertPrimitiveValuesUsingHelperMethods() {
    assertEquals("value", codec.asString("value"));
    assertNull(codec.asString(" "));
    assertNull(codec.nullableString(null));
    assertEquals("42", codec.nullableString(42));
    assertEquals(7, codec.asInt("7", 1));
    assertEquals(1, codec.asInt("broken", 1));
    assertEquals(9, codec.asInt(9, 1));
    assertTrue(codec.asBoolean(true, false));
    assertTrue(codec.asBoolean("true", false));
    assertTrue(codec.asBoolean("1", false));
    assertFalse(codec.asBoolean("nope", true));
  }

  @Test
  void shouldNormalizeTypeWhenValueNegativeOrUnsupported() {
    assertEquals("negative", codec.normalizeType("negative"));
    assertEquals("positive", codec.normalizeType("positive"));
    assertEquals("positive", codec.normalizeType("other"));
  }
}