package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.habit.dto.HabitCreateRequestDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitResponseDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitScheduleDto;
import com.sashplatonov.habbit.runner.habit.dto.HabitUpdateRequestDto;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = MappingConstants.ComponentModel.CDI)
public interface HabitMapper {
  @HabitEntityMappings
  void applyCreate(HabitCreateRequestDto request, @MappingTarget HabitEntity entity);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  @HabitEntityMappings
  void applyUpdate(HabitUpdateRequestDto request, @MappingTarget HabitEntity entity);

  @Mapping(target = "schedule", expression = "java(toSchedule(entity))")
  HabitResponseDto toResponse(HabitEntity entity);

  default HabitScheduleDto toSchedule(HabitEntity entity) {
    if (entity == null || entity.getScheduleType() == null) {
      return null;
    }
    return HabitScheduleDto.builder()
        .type(entity.getScheduleType())
        .weekdays(entity.getScheduleWeekdays())
        .timesPerWeek(entity.getScheduleTimesPerWeek())
        .timesPerMonth(entity.getScheduleTimesPerMonth())
        .weeksOfMonth(entity.getScheduleWeeksOfMonth())
        .build();
  }
}
