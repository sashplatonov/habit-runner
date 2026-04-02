import { useCallback } from 'react';
import type { Habit } from '@/types/habit';

export function useHabitOrderingCallbacks(
  updateHabit: (id: string, data: Partial<Habit>) => Promise<void>
) {
  const applyHabitsOrder = useCallback(
    async (orderedHabits: Habit[]) => {
      await Promise.all(
        orderedHabits.map((habit, index) => {
          if (habit.sortOrder === index) {
            return Promise.resolve();
          }
          return updateHabit(habit.id, { sortOrder: index });
        })
      );
    },
    [updateHabit]
  );

  return { applyHabitsOrder };
}
