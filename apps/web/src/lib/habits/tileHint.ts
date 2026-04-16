/**
 * Tile hint logic for the dashboard, without lucide-react dependencies.
 * Mirrors DashboardHabitTile.helpers.ts but for the Svelte frontend.
 */
import { toCompletionKey } from '$lib/completionKey';
import type { Habit } from '@/types/habit';

export type TileHint = { text: string; type: 'good' | 'warn' | 'tip' };

function getHabitAgeDays(habit: Habit): number {
  return Math.floor((Date.now() - new Date(habit.createdAt).getTime()) / 86_400_000);
}

function getCompletionCount(habit: Habit, target: number, daysAgo: number, windowDays: number): number {
  const today = new Date();
  let count = 0;
  for (let i = daysAgo; i < daysAgo + windowDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toCompletionKey(d);
    if ((habit.completions[key] ?? 0) >= target) { count++; }
  }
  return count;
}

function hintForNewHabit(streak: number): TileHint {
  return streak > 0
    ? { text: `Day ${streak} — great start!`, type: 'good' }
    : { text: 'New habit — start today!', type: 'tip' };
}

function hintForTrend(weekTrend: number, recent7: number): TileHint | null {
  if (weekTrend >= 3) { return { text: 'Trending up this week', type: 'good' }; }
  if (weekTrend <= -3 && recent7 < 3) { return { text: 'Losing momentum — stay consistent', type: 'warn' }; }
  return null;
}

export function computeTileHint(habit: Habit, completionRate: number, streak: number): TileHint | null {
  const target = Math.max(1, habit.dailyTarget ?? 1);
  const ageDays = getHabitAgeDays(habit);

  if (ageDays < 7) { return hintForNewHabit(streak); }

  const recent7 = getCompletionCount(habit, target, 0, 7);
  const prev7   = ageDays >= 14 ? getCompletionCount(habit, target, 7, 7) : 0;
  const weekTrend = ageDays >= 14 ? recent7 - prev7 : 0;

  if (completionRate >= 80 && streak >= 5) {
    return { text: 'On track — great consistency', type: 'good' };
  }

  const trendHint = hintForTrend(weekTrend, recent7);
  if (trendHint) { return trendHint; }

  if (streak === 0 && completionRate > 20) {
    return { text: 'Restart your streak today', type: 'warn' };
  }

  if (ageDays >= 30 && completionRate < 40) {
    return { text: 'Try adjusting schedule or goal', type: 'tip' };
  }

  return null;
}
