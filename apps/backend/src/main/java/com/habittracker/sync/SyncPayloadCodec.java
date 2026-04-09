package com.habittracker.sync;

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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class SyncPayloadCodec {
  private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
  private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
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
      var data = objectMapper.readValue(raw, MAP_TYPE);
      var updatedAt = stringOrNull(data.get("updatedAt"));
      var id = rawString(data.get("id"));
      if (updatedAt == null || id == null) {
        return null;
      }
      return new SyncCursor(Instant.parse(updatedAt), id);
    } catch (JsonProcessingException exception) {
      return null;
    }
  }

  public String calculateNextCursor(List<SyncCursor> rows) {
    SyncCursor latest;
    if (rows.isEmpty()) {
      latest = new SyncCursor(Instant.now(), "");
    } else {
      latest = rows.stream()
          .max((left, right) -> {
            var byTime = left.updatedAt().compareTo(right.updatedAt());
            return byTime != 0 ? byTime : left.id().compareTo(right.id());
          })
          .orElse(new SyncCursor(Instant.now(), ""));
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

  public Map<String, Object> toMap(Map<String, Object> payload) {
    return payload == null ? new HashMap<>() : payload;
  }

  public String jsonOrNull(Object value) {
    if (value == null) {
      return null;
    }
    try {
      return objectMapper.writeValueAsString(value);
    } catch (JsonProcessingException exception) {
      return null;
    }
  }

  public Object parseJsonOrNull(String json) {
    if (json == null || json.isBlank()) {
      return null;
    }
    try {
      return objectMapper.readValue(json, Object.class);
    } catch (JsonProcessingException exception) {
      return null;
    }
  }

  public Object parseJsonOrEmptyList(String json) {
    var parsed = parseJsonOrNull(json);
    return parsed == null ? List.of() : parsed;
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

  private String stringOrNull(Object value) {
    if (value == null) {
      return null;
    }
    var text = String.valueOf(value);
    return text.isBlank() ? null : text;
  }

  private String rawString(Object value) {
    return value == null ? null : String.valueOf(value);
  }
}
