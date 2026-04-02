import type { Habit } from '@/types/habit';

export function formatHabitLabel(habit: Pick<Habit, 'name' | 'icon'>): string {
  return habit.icon ? `${habit.icon} ${habit.name}` : habit.name;
}
