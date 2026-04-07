import type { Habit } from '$lib/types/habit';
import {
  isMandatoryToday,
  calculateScheduledCompletionRate,
  calculateScheduledStreak,
  resolveHabitSchedule,
  isScheduledForDate
} from '$lib/habits/schedule';
import { formatDate } from '$lib/habits/habitStats';
import { completionKeyToCalendarDate, toCompletionKey } from '$lib/completionKey';

export type DashboardFilter = 'all' | 'pending' | 'done' | 'archived';

const CATEGORY_SCORES: Record<string, number> = {
  diet: 0.9, nutrition: 0.9, food: 0.9,
  sleep: 0.85, rest: 0.85,
  quit: 0.95, abstinence: 0.95,
  exercise: 0.6, fitness: 0.6, sport: 0.6, workout: 0.6,
  meditation: 0.55, mindfulness: 0.55,
  reading: 0.4, learning: 0.4, study: 0.4,
  hydration: 0.15, water: 0.15,
  medication: 0.1, vitamins: 0.1, supplements: 0.1,
  journal: 0.35, social: 0.5, cleaning: 0.45, organization: 0.45
};

function scoreTimeFactor(reminderTime?: string): number {
  if (!reminderTime) return 0.3;
  const hour = parseInt(reminderTime.split(':')[0] ?? '12', 10);
  if (hour >= 5 && hour < 12) return 0.0;
  if (hour >= 12 && hour < 17) return 0.3;
  if (hour >= 17 && hour < 22) return 0.6;
  return 0.9;
}

function scoreCategoryFactor(tags: string[]): number {
  const lower = (tags ?? []).map((t) => t.toLowerCase());
  for (const [keyword, score] of Object.entries(CATEGORY_SCORES)) {
    if (lower.some((tag) => tag.includes(keyword))) return score;
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

    if (!isScheduledForDate(schedule, calendarDate) || habit.freezeDays?.includes(calendarDate)) continue;

    const count = habit.completions[key] ?? 0;
    const isSuccess = habit.type === 'negative' ? count === 0 : count >= dailyTarget;
    if (!isSuccess) {
      if (i <= 3) return 1.0;
      if (i <= 7) return 0.7;
      if (i <= 14) return 0.4;
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

    if (!isScheduledForDate(schedule, calendarDate) || habit.freezeDays?.includes(calendarDate)) continue;

    const count = habit.completions[key] ?? 0;
    bits.push(habit.type === 'negative' ? (count === 0 ? 1 : 0) : (count >= dailyTarget ? 1 : 0));
  }

  if (bits.length < 3) return 0.5;
  const mean = bits.reduce((a, b) => a + b, 0) / bits.length;
  const variance = bits.reduce((a, b) => a + (b - mean) ** 2, 0) / bits.length;
  return Math.min(variance / 0.25, 1);
}

function calculateSmartScore(habit: Habit, today: Date): number {
  const habitAgeDays = Math.max(0, (today.getTime() - new Date(habit.createdAt).getTime()) / 86_400_000);
  const ageFactor = 1 - Math.min(habitAgeDays / 66, 1);
  const completionRate = calculateScheduledCompletionRate(habit, habit.completions, today) / 100;
  const completionFactor = 1 - completionRate;
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

function passesBasicFilters(habit: Habit, filter: DashboardFilter, searchQuery: string): boolean {
  if (filter === 'archived') {
    if (!habit.archived) return false;
  } else if (habit.archived) return false;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    if (!habit.name.toLowerCase().includes(q) && !(habit.description?.toLowerCase().includes(q) ?? false)) return false;
  }
  return true;
}

function sortHabits(a: Habit, b: Habit, sortMode: 'custom' | 'smart', today: Date): number {
  if (sortMode === 'custom') return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  const aDueToday = isMandatoryToday(a, today);
  const bDueToday = isMandatoryToday(b, today);
  if (aDueToday !== bDueToday) return aDueToday ? -1 : 1;
  return calculateSmartScore(b, today) - calculateSmartScore(a, today);
}

export function filterAndSortHabits(
  habits: Habit[],
  filter: DashboardFilter,
  selectedTags: string[],
  today: Date,
  sortMode: 'custom' | 'smart',
  searchQuery: string
): Habit[] {
  const todayKey = formatDate(today);
  return habits
    .filter((habit) => {
      if (selectedTags.length > 0 && !(habit.tags || []).some((tag) => selectedTags.includes(tag))) return false;
      if (!passesBasicFilters(habit, filter, searchQuery)) return false;
      const mandatoryToday = isMandatoryToday(habit, today);
      const completedToday = (habit.completions[todayKey] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1);
      if (filter === 'pending') return mandatoryToday && !completedToday;
      if (filter === 'done') return mandatoryToday && completedToday;
      return true;
    })
    .sort((a, b) => sortHabits(a, b, sortMode, today));
}

export function calculateOverallStreak(habits: Habit[]): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 1);
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const key = formatDate(cursor);
    const allDone = habits.every((habit) => {
      if (habit.freezeDays?.includes(completionKeyToCalendarDate(key))) return true;
      if (!isMandatoryToday(habit, cursor)) return true;
      if (habit.type === 'negative') return (habit.completions[key] ?? 0) === 0;
      return (habit.completions[key] ?? 0) >= Math.max(1, habit.dailyTarget ?? 1);
    });
    if (allDone) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}

export function getAllTags(habits: Habit[]): string[] {
  const tags = new Set<string>();
  habits.forEach((h) => (h.tags || []).forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}

export function exportHabitsCsv(habits: Habit[]): void {
  if (typeof document === 'undefined' || habits.length === 0) return;
  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows: string[] = [];
  habits.forEach((habit) => {
    Object.entries(habit.completions).forEach(([date, count]) => {
      if (count > 0) rows.push([date, escapeCsv(habit.name), '1'].join(','));
    });
  });
  const csv = ['Date,Habit Name,Completed', ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `habits-export-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function reorderHabits(
  habits: Habit[],
  sourceId: string,
  targetId: string,
  position: 'above' | 'below'
): Habit[] | null {
  const sourceIndex = habits.findIndex((h) => h.id === sourceId);
  const targetIndex = habits.findIndex((h) => h.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1) return null;
  const ordered = [...habits];
  const [moved] = ordered.splice(sourceIndex, 1);
  let insertIndex = targetIndex + (position === 'below' ? 1 : 0);
  if (sourceIndex < insertIndex) insertIndex = Math.max(0, insertIndex - 1);
  insertIndex = Math.max(0, Math.min(ordered.length, insertIndex));
  ordered.splice(insertIndex, 0, moved);
  return ordered;
}
