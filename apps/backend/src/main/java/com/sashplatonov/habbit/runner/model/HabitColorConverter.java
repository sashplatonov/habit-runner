package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class HabitColorConverter implements AttributeConverter<HabitColor, String> {
  @Override
  public String convertToDatabaseColumn(HabitColor attribute) {
    return attribute != null ? attribute.value() : null;
  }

  @Override
  public HabitColor convertToEntityAttribute(String dbData) {
    return HabitColor.fromOrDefault(dbData, HabitColor.BLUE);
  }
}