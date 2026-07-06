package com.sashplatonov.habbit.runner.sync;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

final class FaultyObjectMapper extends ObjectMapper {
  private final boolean failTypeReferenceReads;
  private final boolean failClassReads;
  private final boolean failWrites;

  FaultyObjectMapper(boolean failTypeReferenceReads, boolean failClassReads, boolean failWrites) {
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
