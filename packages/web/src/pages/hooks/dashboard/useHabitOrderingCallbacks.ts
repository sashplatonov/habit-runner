import { useCallback } from 'react';
import type { Habit } from '@/types/habit';

export function useHabitOrderingCallbacks(
  habits: Habit[],
  filtered: Habit[],
  updateHabit: (id: string, data: Partial<Habit>) => Promise<void>
) {
  const applyHabitsOrder = useCallback(
    async (orderedHabits: Habit[]) => {
      await Promise.all(
        orderedHabits.map((habit, index) => {
          const targetOrder = index;
          if (habit.sortOrder === targetOrder) {
            return Promise.resolve();
          }
          return updateHabit(habit.id, { sortOrder: targetOrder });
        })
      );
    },
    [updateHabit]
  );

  const moveHabit = useCallback(
    async (habitId: string, direction: 'up' | 'down') => {
      const currentIndex = filtered.findIndex((habit) => habit.id === habitId);
      if (currentIndex === -1) {
        return;
      }
      const neighbor = filtered[direction === 'up' ? currentIndex - 1 : currentIndex + 1];
      if (!neighbor) {
        return;
      }
      const ordered = [...habits];
      const sourceIndex = ordered.findIndex((habit) => habit.id === habitId);
      const targetIndex = ordered.findIndex((habit) => habit.id === neighbor.id);
      if (sourceIndex === -1 || targetIndex === -1) {
        return;
      }
      const [moved] = ordered.splice(sourceIndex, 1);
      let insertIndex = direction === 'down' ? targetIndex + 1 : targetIndex;
      if (sourceIndex < insertIndex) {
        insertIndex = Math.max(0, insertIndex - 1);
      }
      ordered.splice(insertIndex, 0, moved);
      await applyHabitsOrder(ordered);
    },
    [applyHabitsOrder, filtered, habits]
  );

  return { applyHabitsOrder, moveHabit };
}
