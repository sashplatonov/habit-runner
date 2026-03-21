import { useMemo } from 'react';
import type { Habit } from '@/types/habit';
import {
  isMandatoryToday,
  calculateScheduledCompletionRate,
  calculateScheduledStreak,
  resolveHabitSchedule,
  isScheduledForDate
} from '@/lib/habits/schedule';
import { formatDate as formatHabitDate } from '@/lib/habits/habitStats';
import { completionKeyToCalendarDate, toCompletionKey } from '@/lib/completionKey';

export type DashboardFilter = 'all' | 'pending' | 'done' | 'archived';

export interface DashboardDataOptions {
  habits: Habit[];
  filter: DashboardFilter;
  selectedTags: string[];
  today: Date;
  sortMode: 'custom' | 'smart';
  searchQuery: string;
}

export function useDashboardData({
  habits,
  filter,
  selectedTags,
  today,
  sortMode,
  searchQuery
}: DashboardDataOptions) {
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    habits.forEach((habit) => (habit.tags || []).forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [habits]);

  const todayKey = formatHabitDate(today);

  const filtered = useMemo(() => {
    return habits
      .filter((habit) => {
        // Tag filter
        if (selectedTags.length > 0 && !(habit.tags || []).some((tag) => selectedTags.includes(tag))) {
          return false;
        }

        // Archive and Search filters
        if (!PassesBasicFilters(habit, filter, searchQuery)) {
          return false;
        }

        // Dashboard specific filters (pending/done)
        // Use isMandatoryToday to exclude habits with met quotas
        const mandatoryToday = isMandatoryToday(habit, today);
        const completedToday = (habit.completions[todayKey] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1);

        if (filter === 'pending') {
          return mandatoryToday && !completedToday;
        }
        if (filter === 'done') {
          return mandatoryToday && completedToday;
        }
        return true;
      })
      .sort((a, b) => SortHabits(a, b, sortMode, today));
  }, [habits, filter, selectedTags, today, todayKey, sortMode, searchQuery]);

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const overallStreak = useMemo(() => CalculateOverallStreak(activeHabits), [activeHabits]);

  return { allTags, filtered, overallStreak };
}

function PassesBasicFilters(habit: Habit, filter: DashboardFilter, searchQuery: string): boolean {
  // Archive filter
  const isArchived = habit.archived;
  if (filter === 'archived') {
    if (!isArchived) {
      return false;
    }
  } else if (isArchived) {
    return false;
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    const nameMatch = habit.name.toLowerCase().includes(q);
    const descMatch = habit.description?.toLowerCase().includes(q) ?? false;
    if (!nameMatch && !descMatch) {
      return false;
    }
  }
  return true;
}

function SortHabits(a: Habit, b: Habit, sortMode: 'custom' | 'smart', today: Date): number {
  const orderA = a.sortOrder ?? 0;
  const orderB = b.sortOrder ?? 0;

  if (sortMode === 'custom') {
    return orderA - orderB;
  }

  // Smart Sort — habits due today always rank above habits not due today
  const aDueToday = isMandatoryToday(a, today);
  const bDueToday = isMandatoryToday(b, today);

  if (aDueToday !== bDueToday) {
    return aDueToday ? -1 : 1;
  }

  // Within the same group, higher score = needs more attention = goes first
  return calculateSmartScore(b, today) - calculateSmartScore(a, today);
}

// ─── Smart Sort Scoring ───────────────────────────────────────────────────────
// Based on behavioral science research (see TODO_SORT.md)

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

/** Baumeister ego depletion — evening habits are objectively harder. */
function scoreTimeFactor(reminderTime?: string): number {
  if (!reminderTime) { return 0.3; }
  const hour = parseInt(reminderTime.split(':')[0] ?? '12', 10);
  if (hour >= 5 && hour < 12) { return 0.0; }
  if (hour >= 12 && hour < 17) { return 0.3; }
  if (hour >= 17 && hour < 22) { return 0.6; }
  return 0.9;
}

/** Category difficulty from empirical research meta-analysis. */
function scoreCategoryFactor(tags: string[]): number {
  const lower = (tags ?? []).map((t) => t.toLowerCase());
  for (const [keyword, score] of Object.entries(CATEGORY_SCORES)) {
    if (lower.some((tag) => tag.includes(keyword))) { return score; }
  }
  return 0.5;
}

/**
 * Dai et al., 2014 — Fresh Start Effect.
 * Days since last missed scheduled day → risk of full abandonment.
 */
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

  return 0.0; // No miss in past 30 days
}

/**
 * Verplanken & Orbell, 2003 — high variance in completion = unstable habit.
 *
 * Measures consistency ON SCHEDULED DAYS only (1 = done, 0 = miss).
 * This way a 3×/week habit completed every scheduled day scores the same
 * as a daily habit with perfect adherence — schedule is not penalised.
 * Max binary variance is 0.25 (50/50 split), normalised to [0, 1].
 */
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

/**
 * Composite priority score — higher = needs more attention.
 *
 * Weights based on:
 *   Lally et al. (2010), Gardner et al. (2012), Dai et al. (2014),
 *   Baumeister ego depletion, Quinn et al. (2010), Wood & Neal (2007)
 */
function calculateSmartScore(habit: Habit, today: Date): number {
  const habitAgeDays = Math.max(0, (today.getTime() - new Date(habit.createdAt).getTime()) / 86_400_000);

  // Lally et al. (2010) — habits < 21 days are maximally fragile
  const ageFactor = 1 - Math.min(habitAgeDays / 66, 1);

  // Gardner et al. (2012) — low completion rate slows automatisation
  const completionRate = calculateScheduledCompletionRate(habit, habit.completions, today) / 100;
  const completionFactor = 1 - completionRate;

  // Streak inertia — streak loss in first 66 days is near-restart
  const { current: currentStreak } = calculateScheduledStreak(habit, habit.completions, today);
  const streakFactor = 1 - Math.min(currentStreak / 66, 1);

  const missFactor = scoreMissFactor(habit, today);
  const timeFactor = scoreTimeFactor(habit.reminderTime);
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

function CalculateOverallStreak(habits: Habit[]): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 1);
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i += 1) {
    const key = formatHabitDate(cursor);

    const allDone = habits.every((habit) => {
      // Frozen days don't count against the streak
      if (habit.freezeDays?.includes(completionKeyToCalendarDate(key))) {
        return true;
      }
      // Check if habit is mandatory for this date (scheduled AND quota not met)
      if (!isMandatoryToday(habit, cursor)) {
        return true;
      }
      // Negative habits succeed when there are zero completions
      if (habit.type === 'negative') {
        return (habit.completions[key] ?? 0) === 0;
      }
      return (habit.completions[key] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1);
    });

    if (allDone) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
