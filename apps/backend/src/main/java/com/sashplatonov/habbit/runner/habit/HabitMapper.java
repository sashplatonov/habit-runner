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

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.CDI)
public interface HabitMapper {
  @HabitEntityMappings
  void applyCreate(HabitCreateRequestDto request, @MappingTarget HabitEntity entity);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  @HabitEntityMappings
  void applyUpdate(HabitUpdateRequestDto request, @MappingTarget HabitEntity entity);

  @Mapping(target = "customDays", expression = "java(copyList(entity.getCustomDays()))")
  @Mapping(target = "schedule", expression = "java(toSchedule(entity))")
  @Mapping(target = "tags", expression = "java(copyList(entity.getTags()))")
  @Mapping(target = "freezeDays", expression = "java(copyList(entity.getFreezeDays()))")
  HabitResponseDto toResponse(HabitEntity entity);

  default HabitScheduleDto toSchedule(HabitEntity entity) {
    if (entity == null || entity.getScheduleType() == null) {
      return null;
    }
    return HabitScheduleDto.builder()
        .type(entity.getScheduleType())
        .weekdays(copyList(entity.getScheduleWeekdays()))
        .timesPerWeek(entity.getScheduleTimesPerWeek())
        .timesPerMonth(entity.getScheduleTimesPerMonth())
        .weeksOfMonth(copyList(entity.getScheduleWeeksOfMonth()))
        .build();
  }

  default <T> List<T> copyList(List<T> source) {
    return source == null ? null : List.copyOf(source);
  }
}
