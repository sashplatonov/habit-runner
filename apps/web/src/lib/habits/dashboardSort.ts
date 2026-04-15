/**
 * Pure smart-sort utilities for the dashboard habit list.
 * Extracted from useDashboardData (React hooks) so they can be used in Svelte.
 */
import type { Habit } from '@/types/habit';
import {
  isMandatoryToday,
  calculateScheduledStreak,
  calculateScheduledCompletionRate,
  resolveHabitSchedule,
  isScheduledForDate
} from '$lib/habits/schedule';
import { toCompletionKey, completionKeyToCalendarDate } from '$lib/completionKey';

const CATEGORY_SCORES: Record<string, number> = {
  diet: 0.9, nutrition: 0.9, food: 0.9,
  sleep: 0.85, rest: 0.85,
  quit: 0.95, abstinence: 0.95,
  exercise: 0.6, fitness: 0.6, sport: 0.6, workout: 0.6,
  meditation: 0.55, mindfulness: 0.55,
  reading: 0.4, learning: 0.4, study: 0.4,
  hydration: 0.15, water: 0.15,
  medication: 0.1, vitamins: 0.1, supplements: 0.1,
  journal: 0.35,
  social: 0.5,
  cleaning: 0.45, organization: 0.45
};

function scoreTimeFactor(reminderTime?: string): number {
  if (!reminderTime) { return 0.3; }
  const hour = parseInt(reminderTime.split(':')[0] ?? '12', 10);
  if (hour >= 5 && hour < 12) { return 0.0; }
  if (hour >= 12 && hour < 17) { return 0.3; }
  if (hour >= 17 && hour < 22) { return 0.6; }
  return 0.9;
}

function scoreCategoryFactor(tags: string[]): number {
  const lower = (tags ?? []).map((t) => t.toLowerCase());
  for (const [keyword, score] of Object.entries(CATEGORY_SCORES)) {
    if (lower.some((tag) => tag.includes(keyword))) { return score; }
  }
  return 0.5;
}

function scoreMissFactor(habit: Habit, today: Date): number {
  const schedule = resolveHabitSchedule(habit);
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);

  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = toCompletionKey(date);
    const calendarDate = completionKeyToCalendarDate(key);

    if (!isScheduledForDate(schedule, calendarDate) || habit.freezeDays?.includes(calendarDate)) {
      continue;
    }

    const count = habit.completions[key] ?? 0;
    const isSuccess = habit.type === 'negative' ? count === 0 : count >= dailyTarget;
    if (!isSuccess) {
      if (i <= 3) { return 1.0; }
      if (i <= 7) { return 0.7; }
      if (i <= 14) { return 0.4; }
      return 0.1;
    }
  }
  return 0.0;
}

function scoreVarianceFactor(habit: Habit, today: Date): number {
  const schedule = resolveHabitSchedule(habit);
  const dailyTarget = Math.max(1, habit.dailyTarget ?? 1);
  const bits: number[] = [];

  for (let i = 1; i <= 60; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = toCompletionKey(date);
    const calendarDate = completionKeyToCalendarDate(key);

    if (!isScheduledForDate(schedule, calendarDate) || habit.freezeDays?.includes(calendarDate)) {
      continue;
    }

    const count = habit.completions[key] ?? 0;
    bits.push(habit.type === 'negative' ? (count === 0 ? 1 : 0) : (count >= dailyTarget ? 1 : 0));
  }

  if (bits.length < 3) { return 0.5; }
  const mean = bits.reduce((a, b) => a + b, 0) / bits.length;
  const variance = bits.reduce((a, b) => a + (b - mean) ** 2, 0) / bits.length;
  return Math.min(variance / 0.25, 1);
}

export function calculateSmartScore(habit: Habit, today: Date): number {
  const habitAgeDays = Math.max(0, (today.getTime() - new Date(habit.createdAt).getTime()) / 86_400_000);
  const ageFactor = 1 - Math.min(habitAgeDays / 66, 1);
  const completionRate = calculateScheduledCompletionRate(habit, habit.completions, today) / 100;
  const completionFactor = 1 - completionRate;
  const { current: currentStreak } = calculateScheduledStreak(habit, habit.completions, today);
  const streakFactor = 1 - Math.min(currentStreak / 66, 1);
  const missFactor = scoreMissFactor(habit, today);
  const timeFactor = scoreTimeFactor((habit as Habit & { reminderTime?: string }).reminderTime);
  const typeFactor = habit.type === 'negative' ? 0.3 : 0.0;
  const categoryFactor = scoreCategoryFactor(habit.tags);
  const varianceFactor = scoreVarianceFactor(habit, today);

  return (
    ageFactor        * 0.20 +
    completionFactor * 0.25 +
    streakFactor     * 0.15 +
    missFactor       * 0.15 +
    timeFactor       * 0.05 +
    typeFactor       * 0.05 +
    categoryFactor   * 0.05 +
    varianceFactor   * 0.02
  );
}

export function sortHabits(a: Habit, b: Habit, sortMode: 'custom' | 'smart', today: Date): number {
  if (sortMode === 'custom') {
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  }

  const aDueToday = isMandatoryToday(a, today);
  const bDueToday = isMandatoryToday(b, today);
  if (aDueToday !== bDueToday) { return aDueToday ? -1 : 1; }

  return calculateSmartScore(b, today) - calculateSmartScore(a, today);
}
