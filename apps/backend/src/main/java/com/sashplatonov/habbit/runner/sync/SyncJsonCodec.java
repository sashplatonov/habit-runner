package com.sashplatonov.habbit.runner.sync;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class SyncJsonCodec {
  private static final TypeReference<List<Integer>> INTEGER_LIST_TYPE = new TypeReference<>() {
  };
  private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
  };

  private final ObjectMapper objectMapper;

  public SyncJsonCodec(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public <T> String jsonOrNull(T value) {
    if (value == null) {
      return null;
    }
    try {
      return objectMapper.writeValueAsString(value);
    } catch (JsonProcessingException exception) {
      return null;
    }
  }

  public JsonNode parseJsonNodeOrNull(String json) {
    if (json == null || json.isBlank()) {
      return null;
    }
    try {
      return objectMapper.readValue(json, JsonNode.class);
    } catch (JsonProcessingException exception) {
      return null;
    }
  }

  public List<Integer> parseIntegerListOrNull(String json) {
    if (json == null || json.isBlank()) {
      return null;
    }
    try {
      return objectMapper.readValue(json, INTEGER_LIST_TYPE);
    } catch (JsonProcessingException exception) {
      return null;
    }
  }

  public List<String> parseStringListOrEmpty(String json) {
    if (json == null || json.isBlank()) {
      return List.of();
    }
    try {
      return objectMapper.readValue(json, STRING_LIST_TYPE);
    } catch (JsonProcessingException exception) {
      return List.of();
    }
  }
}
