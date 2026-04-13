package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class HabitTypeConverter implements AttributeConverter<HabitType, String> {
  @Override
  public String convertToDatabaseColumn(HabitType attribute) {
    return attribute != null ? attribute.value() : null;
  }

  @Override
  public HabitType convertToEntityAttribute(String dbData) {
    return HabitType.fromOrDefault(dbData, HabitType.POSITIVE);
  }
}
