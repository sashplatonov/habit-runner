import type { Habit, HabitStats } from '@/types/habit';
import {
  buildMonthlyCompletionRates,
  buildWeeklyCompletionData,
  countCompletedDays,
  formatDate
} from '$lib/habits/habitStats';
import {
  calculateAutomatismScore,
  calculateScheduledCompletionRate,
  calculateScheduledStreak
} from '$lib/habits/schedule';

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
      totalDays: 0,
      completedDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
      automatismScore: 0,
      weeklyData: [],
      monthlyData: []
    };
  }

  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const now = new Date();
  const { current, longest } = calculateScheduledStreak(habit, habit.completions, now);
  const completionRate = calculateScheduledCompletionRate(habit, habit.completions, now);
  const completedDays = countCompletedDays(habit.completions, dailyTarget);
  const totalDays = Math.max(
    1,
    Math.ceil((Date.now() - new Date(habit.createdAt).getTime()) / 86400000)
  );

  return {
    totalDays,
    completedDays,
    currentStreak: current,
    longestStreak: longest,
    completionRate,
    automatismScore: calculateAutomatismScore(habit, habit.completions, now),
    weeklyData: buildWeeklyCompletionData(habit.completions, 12, now, dailyTarget),
    monthlyData: buildMonthlyCompletionRates(habit.completions, 6, now, dailyTarget)
  };
}