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
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "userId", ignore = true)
  @Mapping(target = "scheduleType", source = "schedule.type")
  @Mapping(target = "scheduleWeekdays", source = "schedule.weekdays")
  @Mapping(target = "scheduleTimesPerWeek", source = "schedule.timesPerWeek")
  @Mapping(target = "scheduleTimesPerMonth", source = "schedule.timesPerMonth")
  @Mapping(target = "scheduleWeeksOfMonth", source = "schedule.weeksOfMonth")
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "version", ignore = true)
  @Mapping(target = "updatedAtExplicitlySet", ignore = true)
  @Mapping(target = "lastReminderSentAt", ignore = true)
  void applyCreate(HabitCreateRequestDto request, @MappingTarget HabitEntity entity);

  @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
  @Mapping(target = "id", ignore = true)
  @Mapping(target = "userId", ignore = true)
  @Mapping(target = "scheduleType", source = "schedule.type")
  @Mapping(target = "scheduleWeekdays", source = "schedule.weekdays")
  @Mapping(target = "scheduleTimesPerWeek", source = "schedule.timesPerWeek")
  @Mapping(target = "scheduleTimesPerMonth", source = "schedule.timesPerMonth")
  @Mapping(target = "scheduleWeeksOfMonth", source = "schedule.weeksOfMonth")
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  @Mapping(target = "version", ignore = true)
  @Mapping(target = "updatedAtExplicitlySet", ignore = true)
  @Mapping(target = "lastReminderSentAt", ignore = true)
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
