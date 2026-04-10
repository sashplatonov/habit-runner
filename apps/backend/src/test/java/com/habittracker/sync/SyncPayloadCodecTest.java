package com.habittracker.sync;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class SyncPayloadCodecTest {

  private final SyncPayloadCodec codec = new SyncPayloadCodec(new ObjectMapper());

  @Test
  void shouldReturnNullWhenCursorBlank() {
    assertNull(codec.parseCursor(" "));
  }

  @Test
  void shouldReturnNullWhenCursorJsonInvalidOrMissingFields() {
    assertNull(codec.parseCursor("not-json"));
    assertNull(codec.parseCursor("{\"updatedAt\":\"2026-04-09T00:00:00Z\"}"));
  }

  @Test
  void shouldParseCursorWhenJsonContainsUpdatedAtAndId() {
    var cursor = codec.parseCursor("{\"updatedAt\":\"2026-04-09T12:00:00Z\",\"id\":\"cursor-1\"}");

    assertNotNull(cursor);
    assertEquals(Instant.parse("2026-04-09T12:00:00Z"), cursor.updatedAt());
    assertEquals("cursor-1", cursor.id());
  }

  @Test
  void shouldReturnCurrentInstantCursorWhenNextCursorRequestedForEmptyRows() {
    var before = Instant.now().minusSeconds(1);
    var encoded = codec.calculateNextCursor(List.of());
    var cursor = codec.parseCursor(encoded);
    var after = Instant.now().plusSeconds(1);

    assertNotNull(cursor);
    assertEquals("", cursor.id());
    assertFalse(cursor.updatedAt().isBefore(before));
    assertFalse(cursor.updatedAt().isAfter(after));
  }

  @Test
  void shouldReturnLatestCursorWhenRowsContainDifferentTimestampsAndIds() {
    var rows = List.of(
        SyncCursor.builder().updatedAt(Instant.parse("2026-04-09T10:00:00Z")).id("b").build(),
        SyncCursor.builder().updatedAt(Instant.parse("2026-04-09T10:00:00Z")).id("c").build(),
        SyncCursor.builder().updatedAt(Instant.parse("2026-04-09T11:00:00Z")).id("a").build()
    );

    var cursor = codec.parseCursor(codec.calculateNextCursor(rows));

    assertEquals(Instant.parse("2026-04-09T11:00:00Z"), cursor.updatedAt());
    assertEquals("a", cursor.id());
  }

  @Test
  void shouldReturnNullWhenCursorSerializationFails() {
    var failingCodec = new SyncPayloadCodec(new FaultyObjectMapper(false, false, true));

    assertNull(failingCodec.calculateNextCursor(List.of(
        SyncCursor.builder().updatedAt(Instant.now()).id("cursor-1").build()
    )));
    assertNull(failingCodec.jsonOrNull(Map.of("key", "value")));
  }

  @Test
  void shouldParseJsonValuesWhenJsonInputPresent() {
    assertEquals(List.of("one", "two"), codec.parseStringListOrEmpty("[\"one\",\"two\"]"));
    assertEquals(List.of(), codec.parseStringListOrEmpty(" "));
    assertEquals(List.of("item"), codec.parseStringListOrEmpty("[\"item\"]"));
    assertEquals(List.of(1, 2, 3), codec.parseIntegerListOrNull("[1,2,3]"));
  }

  @Test
  void shouldReturnNullWhenJsonParsingFails() {
    var failingCodec = new SyncPayloadCodec(new FaultyObjectMapper(true, true, false));

    assertNull(failingCodec.parseCursor("{\"updatedAt\":\"2026-04-09T12:00:00Z\",\"id\":\"cursor-1\"}"));
    assertNull(failingCodec.parseJsonNodeOrNull("{}"));
    assertNull(failingCodec.parseIntegerListOrNull("[1,2]"));
  }

  @Test
  void shouldReturnNullWhenJsonInputBlankOrCursorUpdatedAtBlank() {
    assertNull(codec.parseJsonNodeOrNull(" "));
    assertNull(codec.parseIntegerListOrNull(" "));
    assertNull(codec.parseCursor("{\"updatedAt\":\" \",\"id\":123}"));
  }

  @Test
  void shouldNormalizeInstantsAndDatesWhenValuesValidOrInvalid() {
    var validInstant = codec.normalizeInstant("2026-04-09T12:00:00Z");
    var fallbackInstant = codec.parseInstantOrNow("broken");
    var validDate = codec.toLocalDate("2026-04-09T12:30:00Z");
    var fallbackDate = codec.toLocalDate("broken");

    assertEquals(Instant.parse("2026-04-09T12:00:00Z"), validInstant);
    assertFalse(fallbackInstant.isAfter(Instant.now().plusSeconds(1)));
    assertEquals(LocalDate.of(2026, 4, 9), validDate);
    assertEquals(LocalDate.now(ZoneOffset.UTC), fallbackDate);
  }

  @Test
  void shouldFallbackToCurrentInstantWhenNormalizeInstantReceivesNull() {
    var normalized = codec.normalizeInstant(null);

    assertFalse(normalized.isAfter(Instant.now().plusSeconds(1)));
  }

  @Test
  void shouldReturnFutureInstantAndIsoStringWhenNextSyncDateCalculated() {
    var baseline = Instant.now().plusSeconds(20);
    var nextSyncDate = codec.nextSyncDate(Instant.now(), baseline, Instant.now().minusSeconds(30));
    var explicitIso = codec.toSyncIso(Instant.parse("2026-04-09T12:00:00Z"));
    var currentIso = codec.toSyncIso(null);

    assertEquals(baseline.plusSeconds(1), nextSyncDate);
    assertEquals("2026-04-09T12:00:00Z", explicitIso);
    assertNotNull(Instant.parse(currentIso));
  }

  private static final class FaultyObjectMapper extends ObjectMapper {
    private final boolean failTypeReferenceReads;
    private final boolean failClassReads;
    private final boolean failWrites;

    private FaultyObjectMapper(boolean failTypeReferenceReads, boolean failClassReads, boolean failWrites) {
      this.failTypeReferenceReads = failTypeReferenceReads;
      this.failClassReads = failClassReads;
      this.failWrites = failWrites;
    }

    @Override
    public <T> T readValue(String content, TypeReference<T> valueTypeRef) throws JsonProcessingException {
      if (failTypeReferenceReads) {
        throw new TestJsonProcessingException("type-reference-read-failed");
      }
      return super.readValue(content, valueTypeRef);
    }

    @Override
    public <T> T readValue(String content, Class<T> valueType) throws JsonProcessingException {
      if (failClassReads) {
        throw new TestJsonProcessingException("class-read-failed");
      }
      return super.readValue(content, valueType);
    }

    @Override
    public String writeValueAsString(Object value) throws JsonProcessingException {
      if (failWrites) {
        throw new TestJsonProcessingException("write-failed");
      }
      return super.writeValueAsString(value);
    }
  }

  private static final class TestJsonProcessingException extends JsonProcessingException {
    private TestJsonProcessingException(String message) {
      super(message);
    }
  }
}