package com.sashplatonov.habbit.runner.habit.dto;

import java.util.List;

final class HabitRequestCollections {
  private HabitRequestCollections() {
  }

  static <T> List<T> immutable(List<T> values) {
    return values == null ? null : List.copyOf(values);
  }
}
