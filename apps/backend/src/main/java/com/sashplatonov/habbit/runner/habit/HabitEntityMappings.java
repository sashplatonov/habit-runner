package com.sashplatonov.habbit.runner.habit;

import org.mapstruct.Mapping;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.CLASS)
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
public @interface HabitEntityMappings {
}
