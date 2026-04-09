package com.habittracker.sync;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.habittracker.model.CheckinEntity;
import com.habittracker.model.HabitEntity;
import com.habittracker.model.TombstoneEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;
import com.habittracker.model.SyncOpLogEntity;

import java.math.BigInteger;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

@ApplicationScoped
public class SyncService {
  private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
  private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
  };

  final ObjectMapper objectMapper;

  public SyncService(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  // ─── Pull ─────────────────────────────────────────────────────────────────

  public SyncDtos.PullResponseDto pull(String userId, String since) {
    var cursor = parseCursor(since);

    List<HabitEntity> habits;
    List<CheckinEntity> checkins;
    List<TombstoneEntity> tombstones;

    if (cursor == null) {
      habits = HabitEntity.<HabitEntity>find(
          "userId = ?1 ORDER BY updatedAt ASC, id ASC", userId
      ).page(0, 200).list();
      checkins = CheckinEntity.<CheckinEntity>find(
          "userId = ?1 ORDER BY updatedAt ASC, id ASC", userId
      ).page(0, 200).list();
      tombstones = TombstoneEntity.<TombstoneEntity>find(
          "userId = ?1 ORDER BY deletedAt ASC, id ASC", userId
      ).page(0, 200).list();
    } else {
      habits = HabitEntity.<HabitEntity>find(
          "userId = ?1 AND (updatedAt > ?2 OR (updatedAt = ?2 AND id > ?3)) ORDER BY updatedAt ASC, id ASC",
          userId, cursor.updatedAt(), cursor.id()
      ).page(0, 200).list();
      checkins = CheckinEntity.<CheckinEntity>find(
          "userId = ?1 AND (updatedAt > ?2 OR (updatedAt = ?2 AND id > ?3)) ORDER BY updatedAt ASC, id ASC",
          userId, cursor.updatedAt(), cursor.id()
      ).page(0, 200).list();
      tombstones = TombstoneEntity.<TombstoneEntity>find(
          "userId = ?1 AND (deletedAt > ?2 OR (deletedAt = ?2 AND id > ?3)) ORDER BY deletedAt ASC, id ASC",
          userId, cursor.updatedAt(), cursor.id()
      ).page(0, 200).list();
    }

    var candidates = new ArrayList<CursorRow>();
    habits.forEach(h -> candidates.add(new CursorRow(h.updatedAt, h.id)));
    checkins.forEach(c -> candidates.add(new CursorRow(c.updatedAt, c.id)));
    tombstones.forEach(t -> candidates.add(new CursorRow(t.deletedAt, t.id)));

    var nextCursor = calculateNextCursor(candidates);

    return new SyncDtos.PullResponseDto(
        habits.stream().map(this::serializeHabit).toList(),
        checkins.stream().map(this::serializeCheckin).toList(),
        tombstones.stream().map(this::serializeTombstone).toList(),
        nextCursor,
        toSyncIso(Instant.now())
    );
  }

  // ─── Push ─────────────────────────────────────────────────────────────────

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

  // ─── Habit ops ────────────────────────────────────────────────────────────

  private void applyHabitOp(
      String userId,
      SyncDtos.SyncOpDto op,
      List<String> applied,
      List<SyncDtos.PushConflict> conflicts
  ) {
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

    boolean isNew = false;
    if (existing == null) {
      existing = new HabitEntity();
      existing.id = habitId;
      existing.userId = userId;
      var raw = asString(payload.get("createdAt"));
      existing.createdAt = raw != null ? parseInstantOrNow(raw) : Instant.now();
      isNew = true;
    }

    var name = asString(payload.get("name"));
    existing.name = name != null ? name : (existing.name != null ? existing.name : "Habit");
    existing.description = nullableString(payload.get("description"));
    var color = asString(payload.get("color"));
    existing.color = color != null ? color : (existing.color != null ? existing.color : "#5E81AC");
    var icon = asString(payload.get("icon"));
    existing.icon = icon != null ? icon : (existing.icon != null ? existing.icon : "star");
    var frequency = asString(payload.get("frequency"));
    existing.frequency = frequency != null ? frequency : (existing.frequency != null ? existing.frequency : "daily");
    existing.customDays = normalizeCustomDaysJson(payload.get("customDays"));
    existing.schedule = jsonOrNull(payload.get("schedule"));
    existing.targetStreak = asInt(payload.get("targetStreak"), 1);
    existing.dailyTarget = resolveDailyTarget(payload.get("dailyTarget"), existing.dailyTarget);
    existing.tags = jsonOrNull(payload.get("tags"));
    existing.archived = asBoolean(payload.get("archived"), false);
    existing.sortOrder = resolveSortOrder(payload.get("sortOrder"), existing.sortOrder);
    existing.reminderTime = normalizeReminderTime(asString(payload.get("reminderTime")));
    existing.reminderEnabled = asBoolean(payload.get("reminderEnabled"), existing.reminderEnabled);
    existing.type = normalizeType(asString(payload.get("type")));
    existing.freezeDays = normalizeFreezeDaysJson(payload.get("freezeDays"), existing.freezeDays);
    existing.version = Math.max(existing.version, asInt(payload.get("version"), 0)) + 1;
    existing.updatedAt = nextSyncDate(clientUpdated, existing.updatedAt);

    if (isNew) {
      existing.persist();
    }

    applied.add(op.id());
  }

  private void deleteHabit(String userId, String habitId, Map<String, Object> payload) {
    var tombstone = new TombstoneEntity();
    tombstone.userId = userId;
    tombstone.entity = "habit";
    tombstone.entityId = habitId;
    tombstone.version = asInt(payload.get("version"), 1);
    tombstone.deletedAt = nextSyncDate(parseInstantOrNow(asString(payload.get("updatedAt"))));
    tombstone.persist();

    CheckinEntity.delete("habitId = ?1 and userId = ?2", habitId, userId);
    HabitEntity.delete("id = ?1 and userId = ?2", habitId, userId);
  }

  // ─── Checkin ops ──────────────────────────────────────────────────────────

  private void applyCheckinOp(
      String userId,
      SyncDtos.SyncOpDto op,
      List<String> applied,
      List<SyncDtos.PushConflict> conflicts
  ) {
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
    var existing = CheckinEntity.<CheckinEntity>find(
        "habitId = ?1 and date = ?2 and userId = ?3", habitId, date, userId
    ).firstResult();
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

  private void deleteCheckin(
      String userId,
      String habitId,
      LocalDate date,
      Map<String, Object> payload,
      CheckinEntity existing
  ) {
    var tombstone = new TombstoneEntity();
    tombstone.userId = userId;
    tombstone.entity = "checkin";
    var payloadId = asString(payload.get("id"));
    tombstone.entityId = payloadId != null ? payloadId
        : (existing != null ? existing.id : habitId + ":" + date);
    tombstone.version = asInt(payload.get("version"), 1);
    tombstone.deletedAt = nextSyncDate(parseInstantOrNow(asString(payload.get("updatedAt"))));
    tombstone.persist();

    CheckinEntity.delete("habitId = ?1 and userId = ?2 and date = ?3", habitId, userId, date);
  }

  // ─── Deduplication log ────────────────────────────────────────────────────

  /** Atomically inserts the opId. Returns true if inserted (new op), false if duplicate. */
  private boolean tryCreateLog(String opId) {
    try {
      SyncOpLogEntity log = new SyncOpLogEntity();
      log.opId = opId;
      log.persistAndFlush();
      return true;
    } catch (PersistenceException ex) {
      // Duplicate opId and any other persistence error are treated as not-inserted.
      return false;
    }
  }

  // ─── Serialization ────────────────────────────────────────────────────────

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

  // ─── Cursor helpers ───────────────────────────────────────────────────────

  private CursorRow parseCursor(String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }
    try {
      var data = objectMapper.readValue(raw, MAP_TYPE);
      var updatedAtStr = asString(data.get("updatedAt"));
      var id = asString(data.get("id"));
      if (updatedAtStr == null || id == null) {
        return null;
      }
      return new CursorRow(Instant.parse(updatedAtStr), id);
    } catch (Exception ex) {
      return null;
    }
  }

  private String calculateNextCursor(List<CursorRow> rows) {
    CursorRow latest;
    if (rows.isEmpty()) {
      // Always return a cursor so clients know sync happened up to now
      latest = new CursorRow(Instant.now(), "");
    } else {
      latest = rows.stream().max((a, b) -> {
        var cmp = a.updatedAt().compareTo(b.updatedAt());
        return cmp != 0 ? cmp : a.id().compareTo(b.id());
      }).orElse(new CursorRow(Instant.now(), ""));
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

  // ─── Normalization helpers ────────────────────────────────────────────────

  /** Validates HH:MM format, returns null if invalid (mirrors NestJS normalizeReminderTime). */
  private String normalizeReminderTime(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    if (!value.matches("^\\d{2}:\\d{2}$")) {
      return null;
    }
    var parts = value.split(":");
    int hours = Integer.parseInt(parts[0]);
    int minutes = Integer.parseInt(parts[1]);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    return String.format("%02d:%02d", hours, minutes);
  }

  /** Filters customDays to valid values 0–6, deduplicates (mirrors NestJS normalizeCustomDays). */
  @SuppressWarnings("unchecked")
  private String normalizeCustomDaysJson(Object value) {
    if (!(value instanceof List)) {
      return null;
    }
    var seen = new HashSet<Integer>();
    var result = new ArrayList<Integer>();
    for (var item : (List<?>) value) {
      if (item instanceof Number num) {
        int day = (int) num.doubleValue();
        if (day >= 0 && day <= 6 && seen.add(day)) {
          result.add(day);
        }
      }
    }
    if (result.isEmpty()) {
      return null;
    }
    return jsonOrNull(result);
  }

  /**
   * Validates freezeDays — each entry must match yyyy-MM-dd; deduplicates and sorts.
   * Falls back to existing if payload is absent/invalid.
   */
  @SuppressWarnings("unchecked")
  private String normalizeFreezeDaysJson(Object payloadValue, String existing) {
    if (payloadValue == null) {
      return existing != null ? existing : "[]";
    }
    if (!(payloadValue instanceof List)) {
      return "[]";
    }
    var seen = new TreeSet<String>();
    for (var item : (List<?>) payloadValue) {
      if (item instanceof String s && s.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
        seen.add(s);
      }
    }
    return jsonOrNull(new ArrayList<>(seen));
  }

  /** Mirrors NestJS resolveSortOrder — falls back to existing when payload is invalid. */
  private BigInteger resolveSortOrder(Object payload, BigInteger existing) {
    if (payload instanceof Number num) {
      double val = num.doubleValue();
      if (Double.isFinite(val)) {
        return BigInteger.valueOf((long) val);
      }
    }
    return existing != null ? existing : BigInteger.ZERO;
  }

  /** Mirrors NestJS resolveDailyTarget — min 1, falls back to existing. */
  private int resolveDailyTarget(Object payload, int existingValue) {
    if (payload instanceof Number num) {
      double val = num.doubleValue();
      if (Double.isFinite(val)) {
        return Math.max(1, (int) val);
      }
    }
    return Math.max(1, existingValue > 0 ? existingValue : 1);
  }

  // ─── Utility helpers ──────────────────────────────────────────────────────

  private Instant normalizeInstant(String value) {
    return value != null ? parseInstantOrNow(value) : Instant.now();
  }

  private Instant parseInstantOrNow(String value) {
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
      if (value != null && value.length() >= 10) {
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
    if (instant == null) {
      return ISO.format(OffsetDateTime.now(ZoneOffset.UTC));
    }
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
    return value == null ? null : String.valueOf(value);
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
