package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class HabitFrequencyConverter implements AttributeConverter<HabitFrequency, String> {
  @Override
  public String convertToDatabaseColumn(HabitFrequency attribute) {
    return attribute != null ? attribute.value() : null;
  }

  @Override
  public HabitFrequency convertToEntityAttribute(String dbData) {
    return HabitFrequency.fromOrDefault(dbData, HabitFrequency.DAILY);
  }
}