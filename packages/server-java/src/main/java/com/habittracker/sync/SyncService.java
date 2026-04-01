package com.habittracker.sync;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.habittracker.model.CheckinEntity;
import com.habittracker.model.HabitEntity;
import com.habittracker.model.SyncOpLogEntity;
import com.habittracker.model.TombstoneEntity;
import io.quarkus.hibernate.orm.panache.Panache;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class SyncService {
  private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
  private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
  };

  final ObjectMapper objectMapper;

  public SyncService(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public SyncDtos.PullResponseDto pull(String userId, String since) {
    var cursor = parseCursor(since);
    var habits = HabitEntity.<HabitEntity>find("userId", userId).list();
    var checkins = CheckinEntity.<CheckinEntity>find("userId", userId).list();
    var tombstones = TombstoneEntity.<TombstoneEntity>find("userId", userId).list();

    var filteredHabits = habits.stream()
        .filter(h -> cursor == null || isAfterCursor(h.updatedAt, h.id, cursor))
        .sorted(Comparator.comparing((HabitEntity h) -> h.updatedAt).thenComparing(h -> h.id))
        .limit(200)
        .toList();

    var filteredCheckins = checkins.stream()
        .filter(c -> cursor == null || isAfterCursor(c.updatedAt, c.id, cursor))
        .sorted(Comparator.comparing((CheckinEntity c) -> c.updatedAt).thenComparing(c -> c.id))
        .limit(200)
        .toList();

    var filteredTombstones = tombstones.stream()
        .filter(t -> cursor == null || isAfterCursor(t.deletedAt, t.id, cursor))
        .sorted(Comparator.comparing((TombstoneEntity t) -> t.deletedAt).thenComparing(t -> t.id))
        .limit(200)
        .toList();

    var candidates = new ArrayList<CursorRow>();
    filteredHabits.forEach(h -> candidates.add(new CursorRow(h.updatedAt, h.id)));
    filteredCheckins.forEach(c -> candidates.add(new CursorRow(c.updatedAt, c.id)));
    filteredTombstones.forEach(t -> candidates.add(new CursorRow(t.deletedAt, t.id)));

    var nextCursor = calculateNextCursor(candidates);

    return new SyncDtos.PullResponseDto(
        filteredHabits.stream().map(this::serializeHabit).toList(),
        filteredCheckins.stream().map(this::serializeCheckin).toList(),
        filteredTombstones.stream().map(this::serializeTombstone).toList(),
        nextCursor,
        toSyncIso(Instant.now())
    );
  }

  @Transactional
  public SyncDtos.PushResponseDto push(String userId, List<SyncDtos.SyncOpDto> ops) {
    var applied = new ArrayList<String>();
    var conflicts = new ArrayList<SyncDtos.PushConflict>();

    for (var op : ops) {
      if (op.id() == null || op.id().isBlank()) {
        continue;
      }
      if (!tryCreateLog(op.id())) {
        continue;
      }
      if ("habit".equals(op.entity())) {
        applyHabitOp(userId, op, applied, conflicts);
      } else if ("checkin".equals(op.entity())) {
        applyCheckinOp(userId, op, applied, conflicts);
      }
    }

    return new SyncDtos.PushResponseDto(applied, conflicts, toSyncIso(Instant.now()));
  }

  private void applyHabitOp(String userId, SyncDtos.SyncOpDto op, List<String> applied, List<SyncDtos.PushConflict> conflicts) {
    var payload = toMap(op.payload());
    var habitId = asString(payload.get("id"));
    if (habitId == null) {
      return;
    }

    if ("delete".equals(op.type())) {
      deleteHabit(userId, habitId, payload);
      applied.add(op.id());
      return;
    }

    var existing = (HabitEntity) HabitEntity.findById(habitId);
    if (existing != null && !userId.equals(existing.userId)) {
      conflicts.add(new SyncDtos.PushConflict(op.id(), "habit belongs to another user", null));
      return;
    }

    var clientUpdated = normalizeInstant(asString(payload.get("updatedAt")));
    if (existing != null && existing.updatedAt.isAfter(clientUpdated)) {
      conflicts.add(new SyncDtos.PushConflict(op.id(), "server already has newer habit", Map.of(
          "version", existing.version,
          "updatedAt", toSyncIso(existing.updatedAt)
      )));
      return;
    }

    if (existing == null) {
      existing = new HabitEntity();
      existing.id = habitId;
      existing.userId = userId;
      existing.createdAt = normalizeInstant(asString(payload.get("createdAt")));
      if (existing.createdAt == null) {
        existing.createdAt = Instant.now();
      }
      existing.persist();
    }

    existing.name = asString(payload.get("name"));
    existing.description = nullableString(payload.get("description"));
    existing.color = asString(payload.get("color"));
    existing.icon = asString(payload.get("icon"));
    existing.frequency = asString(payload.get("frequency"));
    existing.customDays = jsonOrNull(payload.get("customDays"));
    existing.schedule = jsonOrNull(payload.get("schedule"));
    existing.targetStreak = asInt(payload.get("targetStreak"), 1);
    existing.dailyTarget = Math.max(1, asInt(payload.get("dailyTarget"), existing.dailyTarget > 0 ? existing.dailyTarget : 1));
    existing.tags = jsonOrNull(payload.get("tags"));
    existing.archived = asBoolean(payload.get("archived"), false);
    existing.sortOrder = BigInteger.valueOf(asInt(payload.get("sortOrder"), 0));
    existing.reminderTime = nullableString(payload.get("reminderTime"));
    existing.reminderEnabled = asBoolean(payload.get("reminderEnabled"), true);
    existing.type = normalizeType(asString(payload.get("type")));
    existing.freezeDays = jsonOrDefault(payload.get("freezeDays"), "[]");
    existing.version = Math.max(existing.version, asInt(payload.get("version"), 0)) + 1;
    existing.updatedAt = nextSyncDate(clientUpdated, existing.updatedAt);

    applied.add(op.id());
  }

  private void applyCheckinOp(String userId, SyncDtos.SyncOpDto op, List<String> applied, List<SyncDtos.PushConflict> conflicts) {
    var payload = toMap(op.payload());
    var habitId = asString(payload.get("habitId"));
    var dateString = asString(payload.get("date"));
    if (habitId == null || dateString == null) {
      return;
    }

    var parent = (HabitEntity) HabitEntity.findById(habitId);
    if (parent == null || !userId.equals(parent.userId)) {
      conflicts.add(new SyncDtos.PushConflict(op.id(), "checkin habit belongs to another user", null));
      return;
    }

    var date = toLocalDate(dateString);
    var existing = CheckinEntity.<CheckinEntity>find("habitId = ?1 and date = ?2 and userId = ?3", habitId, date, userId).firstResult();
    var clientUpdated = normalizeInstant(asString(payload.get("updatedAt")));

    if ("delete".equals(op.type())) {
      deleteCheckin(userId, habitId, date, payload, existing);
      applied.add(op.id());
      return;
    }

    if (existing != null && existing.updatedAt.isAfter(clientUpdated)) {
      conflicts.add(new SyncDtos.PushConflict(op.id(), "server already has newer checkin", Map.of(
          "version", existing.version,
          "updatedAt", toSyncIso(existing.updatedAt)
      )));
      return;
    }

    if (existing == null) {
      existing = new CheckinEntity();
      existing.habitId = habitId;
      existing.userId = userId;
      existing.date = date;
      existing.persist();
    }

    existing.done = asBoolean(payload.get("done"), false);
    existing.count = Math.max(1, asInt(payload.get("count"), 1));
    existing.version = Math.max(existing.version, asInt(payload.get("version"), 0)) + 1;
    existing.updatedAt = nextSyncDate(clientUpdated, existing.updatedAt);

    applied.add(op.id());
  }

  private void deleteHabit(String userId, String habitId, Map<String, Object> payload) {
    var tombstone = new TombstoneEntity();
    tombstone.userId = userId;
    tombstone.entity = "habit";
    tombstone.entityId = habitId;
    tombstone.version = asInt(payload.get("version"), 1);
    tombstone.deletedAt = nextSyncDate(normalizeInstant(asString(payload.get("updatedAt"))), null);
    tombstone.persist();

    Panache.executeUpdate("delete from CheckinEntity where habitId = ?1 and userId = ?2", habitId, userId);
    Panache.executeUpdate("delete from HabitEntity where id = ?1 and userId = ?2", habitId, userId);
  }

  private void deleteCheckin(String userId, String habitId, LocalDate date, Map<String, Object> payload, CheckinEntity existing) {
    var tombstone = new TombstoneEntity();
    tombstone.userId = userId;
    tombstone.entity = "checkin";
    var payloadId = asString(payload.get("id"));
    tombstone.entityId = payloadId != null ? payloadId : (existing != null ? existing.id : habitId + ":" + date);
    tombstone.version = asInt(payload.get("version"), 1);
    tombstone.deletedAt = nextSyncDate(normalizeInstant(asString(payload.get("updatedAt"))), null);
    tombstone.persist();

    Panache.executeUpdate("delete from CheckinEntity where habitId = ?1 and userId = ?2 and date = ?3", habitId, userId, date);
  }

  private boolean tryCreateLog(String opId) {
    var existing = SyncOpLogEntity.findById(opId);
    if (existing != null) {
      return false;
    }
    var log = new SyncOpLogEntity();
    log.opId = opId;
    log.persist();
    return true;
  }

  private SyncDtos.HabitDto serializeHabit(HabitEntity habit) {
    return new SyncDtos.HabitDto(
        habit.id,
        habit.name,
        habit.description == null ? "" : habit.description,
        habit.color,
        habit.icon,
        habit.frequency,
        parseJsonOrNull(habit.customDays),
        parseJsonOrNull(habit.schedule),
        habit.targetStreak,
        habit.dailyTarget,
        parseJsonOrEmptyList(habit.tags),
        habit.archived,
        toSyncIso(habit.createdAt),
        toSyncIso(habit.updatedAt),
        habit.version,
        habit.sortOrder == null ? 0 : habit.sortOrder.intValue(),
        habit.reminderTime,
        habit.reminderEnabled,
        habit.type,
        parseJsonOrEmptyList(habit.freezeDays)
    );
  }

  private SyncDtos.CheckinDto serializeCheckin(CheckinEntity checkin) {
    return new SyncDtos.CheckinDto(
        checkin.id,
        checkin.habitId,
        checkin.date.toString(),
        checkin.done,
        checkin.count,
        toSyncIso(checkin.updatedAt),
        checkin.version
    );
  }

  private SyncDtos.TombstoneDto serializeTombstone(TombstoneEntity tombstone) {
    return new SyncDtos.TombstoneDto(
        tombstone.id,
        tombstone.entity,
        tombstone.entityId,
        toSyncIso(tombstone.deletedAt),
        tombstone.version
    );
  }

  private boolean isAfterCursor(Instant time, String id, CursorRow cursor) {
    if (time == null) {
      return false;
    }
    if (time.isAfter(cursor.updatedAt())) {
      return true;
    }
    if (time.isBefore(cursor.updatedAt())) {
      return false;
    }
    return id.compareTo(cursor.id()) > 0;
  }

  private CursorRow parseCursor(String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }
    try {
      var data = objectMapper.readValue(raw, MAP_TYPE);
      var updatedAt = normalizeInstant(asString(data.get("updatedAt")));
      var id = asString(data.get("id"));
      if (updatedAt == null || id == null) {
        return null;
      }
      return new CursorRow(updatedAt, id);
    } catch (Exception ex) {
      return null;
    }
  }

  private String calculateNextCursor(List<CursorRow> rows) {
    if (rows.isEmpty()) {
      return null;
    }
    var latest = rows.stream().max((a, b) -> {
      var cmp = a.updatedAt().compareTo(b.updatedAt());
      if (cmp != 0) {
        return cmp;
      }
      return a.id().compareTo(b.id());
    }).orElse(null);

    if (latest == null) {
      return null;
    }

    try {
      return objectMapper.writeValueAsString(Map.of(
          "updatedAt", toSyncIso(latest.updatedAt()),
          "id", latest.id()
      ));
    } catch (Exception ex) {
      return null;
    }
  }

  private Instant normalizeInstant(String value) {
    if (value == null || value.isBlank()) {
      return Instant.now();
    }
    try {
      return Instant.parse(value);
    } catch (Exception ex) {
      return Instant.now();
    }
  }

  private LocalDate toLocalDate(String value) {
    try {
      if (value.length() >= 10) {
        return LocalDate.parse(value.substring(0, 10));
      }
    } catch (Exception ignored) {
    }
    return LocalDate.now(ZoneOffset.UTC);
  }

  private Instant nextSyncDate(Instant... values) {
    var max = Instant.now();
    for (var value : values) {
      if (value != null && value.isAfter(max)) {
        max = value;
      }
    }
    return max.plusSeconds(1);
  }

  private String toSyncIso(Instant instant) {
    return ISO.format(OffsetDateTime.ofInstant(instant, ZoneOffset.UTC));
  }

  private Map<String, Object> toMap(Map<String, Object> payload) {
    return payload == null ? new HashMap<>() : payload;
  }

  private String asString(Object value) {
    if (value == null) {
      return null;
    }
    var text = String.valueOf(value);
    return text.isBlank() ? null : text;
  }

  private String nullableString(Object value) {
    if (value == null) {
      return null;
    }
    return String.valueOf(value);
  }

  private int asInt(Object value, int fallback) {
    if (value instanceof Number number) {
      return number.intValue();
    }
    if (value instanceof String text) {
      try {
        return Integer.parseInt(text);
      } catch (Exception ignored) {
      }
    }
    return fallback;
  }

  private boolean asBoolean(Object value, boolean fallback) {
    if (value instanceof Boolean bool) {
      return bool;
    }
    if (value instanceof String text) {
      return "true".equalsIgnoreCase(text) || "1".equals(text);
    }
    return fallback;
  }

  private String normalizeType(String type) {
    return "negative".equals(type) ? "negative" : "positive";
  }

  private String jsonOrNull(Object value) {
    if (value == null) {
      return null;
    }
    try {
      return objectMapper.writeValueAsString(value);
    } catch (Exception ex) {
      return null;
    }
  }

  private String jsonOrDefault(Object value, String fallbackJson) {
    var result = jsonOrNull(value);
    return result == null ? fallbackJson : result;
  }

  private Object parseJsonOrNull(String json) {
    if (json == null || json.isBlank()) {
      return null;
    }
    try {
      return objectMapper.readValue(json, Object.class);
    } catch (Exception ex) {
      return null;
    }
  }

  private Object parseJsonOrEmptyList(String json) {
    var parsed = parseJsonOrNull(json);
    return parsed == null ? List.of() : parsed;
  }

  private record CursorRow(Instant updatedAt, String id) {
  }
}
