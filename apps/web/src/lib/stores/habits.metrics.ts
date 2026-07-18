import type { Habit, HabitStats } from '@/types/habit';
import { countCompletedDays, formatDate } from '$lib/habits/habitStats';
import { calculateScheduledStreak } from '$lib/habits/schedule';

export function getTodayCompletionRate(habits: Habit[]): number {
  if (habits.length === 0) {
    return 0;
  }

  const today = formatDate(new Date());
  const completed = habits.filter((habit) => (
    (habit.completions[today] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1)
  )).length;

  return Math.round((completed / habits.length) * 100);
}

export function getHabitStats(habitId: string, allHabits: Habit[]): HabitStats {
  const habit = allHabits.find((item) => item.id === habitId);
  if (!habit) {
    return {
      completedDays: 0,
      longestStreak: 0
    };
  }

  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const now = new Date();
  const { longest } = calculateScheduledStreak(habit, habit.completions, now);
  const completedDays = countCompletedDays(habit.completions, dailyTarget);

  return {
    completedDays,
    longestStreak: longest
  };
}
