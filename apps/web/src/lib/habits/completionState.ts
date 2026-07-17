import type { Habit } from '@/types/habit';

export type HabitCompletionState = {
  count: number;
  target: number;
  completed: boolean;
  isNegative: boolean;
};

export function getHabitCompletionState(habit: Habit, dateKey: string): HabitCompletionState {
  const count = Math.max(0, Math.trunc(habit.completions[dateKey] ?? 0));
  const target = Math.max(1, Math.trunc(habit.dailyTarget ?? 1));
  const isNegative = habit.type === 'negative';

  return {
    count,
    target,
    completed: isNegative ? count === 0 : count >= target,
    isNegative
  };
}

export function getHabitCompletionActionLabel(habitName: string, state: HabitCompletionState): string {
  if (state.isNegative) {
    return state.count > 0 ? `Undo slip for ${habitName}` : `Record slip for ${habitName}`;
  }

  return state.completed ? `Undo ${habitName}` : `Complete ${habitName}`;
}
