package com.sashplatonov.habbit.runner.sync;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@ApplicationScoped
// This codec is the single point for translating between multiple DTO and value types.
// Splitting it would scatter the conversion logic without reducing real dependencies.
public class SyncPayloadCodec {
  private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
  private static final TypeReference<Map<String, String>> CURSOR_TYPE = new TypeReference<>() {
  };

  private final ObjectMapper objectMapper;

  public SyncPayloadCodec(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public SyncCursor parseCursor(String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }
    try {
      var data = objectMapper.readValue(raw, CURSOR_TYPE);
      var updatedAt = stringOrNull(data.get("updatedAt"));
      var id = rawString(data.get("id"));
      if (updatedAt == null || id == null) {
        return null;
      }
      return SyncCursor.builder()
          .updatedAt(Instant.parse(updatedAt))
          .id(id)
          .build();
    } catch (JsonProcessingException exception) {
      return null;
    }
  }

  public String calculateNextCursor(List<SyncCursor> rows) {
    SyncCursor latest;
    if (rows.isEmpty()) {
      latest = SyncCursor.builder()
          .updatedAt(Instant.now())
          .id("")
          .build();
    } else {
      latest = rows.stream()
          .max((left, right) -> {
            var byTime = left.updatedAt().compareTo(right.updatedAt());
            return byTime != 0 ? byTime : left.id().compareTo(right.id());
          })
          .orElse(SyncCursor.builder()
              .updatedAt(Instant.now())
              .id("")
              .build());
    }

    try {
      return objectMapper.writeValueAsString(Map.of(
          "updatedAt", latest.updatedAt().toString(),
          "id", latest.id()
      ));
    } catch (JsonProcessingException exception) {
      return null;
    }
  }

  public Instant normalizeInstant(String value) {
    return value != null ? parseInstantOrNow(value) : Instant.now();
  }

  public Instant parseInstantOrNow(String value) {
    if (value == null || value.isBlank()) {
      return Instant.now();
    }
    try {
      return Instant.parse(value);
    } catch (DateTimeParseException exception) {
      return Instant.now();
    }
  }

  public LocalDate toLocalDate(String value) {
    try {
      if (value != null && value.length() >= 10) {
        return LocalDate.parse(value.substring(0, 10));
      }
    } catch (DateTimeParseException exception) {
      return LocalDate.now(ZoneOffset.UTC);
    }
    return LocalDate.now(ZoneOffset.UTC);
  }

  public Instant nextSyncDate(Instant... values) {
    var max = Instant.now();
    for (var value : values) {
      if (value != null && value.isAfter(max)) {
        max = value;
      }
    }
    return max.plusSeconds(1);
  }

  public String toSyncIso(Instant instant) {
    if (instant == null) {
      return ISO.format(OffsetDateTime.now(ZoneOffset.UTC));
    }
    return ISO.format(OffsetDateTime.ofInstant(instant, ZoneOffset.UTC));
  }

  ObjectMapper objectMapper() {
    return objectMapper;
  }

  private String stringOrNull(String value) {
    if (value == null) {
      return null;
    }
    return value.isBlank() ? null : value;
  }

  private String rawString(String value) {
    return value == null ? null : value;
  }
}
