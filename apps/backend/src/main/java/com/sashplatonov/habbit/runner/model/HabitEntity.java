package com.sashplatonov.habbit.runner.model;

import com.sashplatonov.habbit.runner.habit.support.HabitMutationSupport;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigInteger;
import java.util.List;

@Entity
@Table(
    name = "habits",
    indexes = {
      @Index(name = "habits_user_updated_cursor_idx", columnList = "userId,updatedAt,id"),
      @Index(name = "habits_user_sort_cursor_idx", columnList = "userId,sortOrder,createdAt,id")
    }
)
@Getter
@Setter
public class HabitEntity extends HabitLifecycleEntityBase {
  @Column(name = "userId", nullable = false)
  private String userId;

  @Column(nullable = false)
  private String name;

  @Column
  private String description;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private HabitColor color;

  @Column(nullable = false)
  private String icon;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private HabitFrequency frequency;

  @ElementCollection
  @CollectionTable(name = "habit_custom_days", joinColumns = @JoinColumn(name = "habit_id"))
  @OrderColumn(name = "position_index")
  @Column(name = "day_value", nullable = false)
  private List<Integer> customDays;

  @ElementCollection
  @CollectionTable(name = "habit_freeze_days", joinColumns = @JoinColumn(name = "habit_id"))
  @OrderColumn(name = "position_index")
  @Column(name = "freeze_day_value", nullable = false)
  private List<String> freezeDays;

  @PrePersist
  void prePersist() {
    HabitMutationSupport.normalize(this);
  }

  public BigInteger sortOrderOrZero() {
    return getSortOrder() != null ? getSortOrder() : BigInteger.ZERO;
  }
}
