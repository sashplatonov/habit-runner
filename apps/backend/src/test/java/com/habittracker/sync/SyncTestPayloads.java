package com.habittracker.sync;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.habittracker.model.HabitColor;
import com.habittracker.model.HabitFrequency;
import com.habittracker.model.HabitType;
import com.habittracker.sync.dto.SyncOpDto;
import com.habittracker.sync.dto.SyncOpPayloadDto;

import java.util.List;
import java.util.Map;

final class SyncTestPayloads {
  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

  private SyncTestPayloads() {
  }

  @SuppressWarnings("PMD.ExcessiveParameterList")
  static SyncOpDto syncOp(String id, String entity, String type, Map<String, Object> payload, String clientTime) {
    return SyncOpDto.builder()
        .id(id)
        .entity(entity)
      .type(SyncOperationType.from(type))
        .payload(toPayload(payload))
        .clientTime(clientTime)
        .build();
  }

  @SuppressWarnings("unchecked")
  private static SyncOpPayloadDto toPayload(Map<String, Object> payload) {
    if (payload == null) {
      return SyncOpPayloadDto.builder().build();
    }
    return SyncOpPayloadDto.builder()
        .id(asString(payload.get("id")))
        .habitId(asString(payload.get("habitId")))
        .date(asString(payload.get("date")))
        .name(asString(payload.get("name")))
        .description(asString(payload.get("description")))
        .color(HabitColor.from(asString(payload.get("color"))))
        .icon(asString(payload.get("icon")))
        .frequency(HabitFrequency.from(asString(payload.get("frequency"))))
        .customDays(toIntegerList(payload.get("customDays")))
        .schedule(toJsonNode(payload.get("schedule")))
        .targetStreak(asInteger(payload.get("targetStreak")))
        .dailyTarget(asInteger(payload.get("dailyTarget")))
        .tags(toStringList(payload.get("tags")))
        .archived(asBoolean(payload.get("archived")))
        .createdAt(asString(payload.get("createdAt")))
        .updatedAt(asString(payload.get("updatedAt")))
        .version(asInteger(payload.get("version")))
        .sortOrder(asInteger(payload.get("sortOrder")))
        .reminderTime(asString(payload.get("reminderTime")))
        .reminderEnabled(asBoolean(payload.get("reminderEnabled")))
        .type(HabitType.from(asString(payload.get("type"))))
        .freezeDays(toStringList(payload.get("freezeDays")))
        .done(asBoolean(payload.get("done")))
        .count(asInteger(payload.get("count")))
        .build();
  }

  @SuppressWarnings("unchecked")
  private static List<Integer> toIntegerList(Object value) {
    return value instanceof List<?> list ? (List<Integer>) list : null;
  }

  @SuppressWarnings("unchecked")
  private static List<String> toStringList(Object value) {
    return value instanceof List<?> list ? (List<String>) list : null;
  }

  private static JsonNode toJsonNode(Object value) {
    return value == null ? null : OBJECT_MAPPER.valueToTree(value);
  }

  private static String asString(Object value) {
    return value == null ? null : String.valueOf(value);
  }

  private static Integer asInteger(Object value) {
    return value instanceof Number number ? number.intValue() : null;
  }

  private static Boolean asBoolean(Object value) {
    return value instanceof Boolean bool ? bool : null;
  }
}
