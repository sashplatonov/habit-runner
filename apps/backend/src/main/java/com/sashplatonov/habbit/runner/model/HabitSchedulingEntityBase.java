package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.OrderColumn;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@MappedSuperclass
@Getter
@Setter
public abstract class HabitSchedulingEntityBase extends UuidAuditedEntityBase {
  @Column(name = "schedule_type")
  @Enumerated(EnumType.STRING)
  private HabitScheduleType scheduleType;

  @Column(name = "schedule_times_per_week")
  private Integer scheduleTimesPerWeek;

  @Column(name = "schedule_times_per_month")
  private Integer scheduleTimesPerMonth;

  @ElementCollection
  @CollectionTable(name = "habit_schedule_weekdays", joinColumns = @JoinColumn(name = "habit_id"))
  @OrderColumn(name = "position_index")
  @Column(name = "weekday_value", nullable = false)
  private List<Integer> scheduleWeekdays;

  @ElementCollection(targetClass = WeekOfMonthValue.class)
  @CollectionTable(name = "habit_schedule_weeks_of_month", joinColumns = @JoinColumn(name = "habit_id"))
  @OrderColumn(name = "position_index")
  @Enumerated(EnumType.STRING)
  @Column(name = "week_value", nullable = false)
  private List<WeekOfMonthValue> scheduleWeeksOfMonth;

  @Column(name = "targetStreak", nullable = false)
  private int targetStreak;

  @Column(name = "dailyTarget", nullable = false)
  private int dailyTarget;
}
