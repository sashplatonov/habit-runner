package com.sashplatonov.habbit.runner.model;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

import java.math.BigInteger;
import java.util.List;

@MappedSuperclass
@Getter
@Setter
public abstract class HabitLifecycleEntityBase extends HabitSchedulingEntityBase {
  @ElementCollection
  @CollectionTable(name = "habit_tags", joinColumns = @JoinColumn(name = "habit_id"))
  @OrderColumn(name = "position_index")
  @Column(name = "tag_value", nullable = false)
  private List<String> tags;

  @Column(nullable = false)
  private boolean archived;

  @Column(name = "sortOrder", nullable = false)
  private BigInteger sortOrder;

  @Column(name = "reminderTime")
  private String reminderTime;

  @Column(name = "reminderEnabled", nullable = false)
  private boolean reminderEnabled;

  @Column(name = "lastReminderSentAt")
  private java.time.Instant lastReminderSentAt;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private HabitType type;

  @Column(nullable = false)
  @Version
  private int version;
}
