import { toCompletionKey } from '$lib/completionKey';
import type { Habit } from '$lib/types/habit';

export type TileHint = { iconName: string; text: string; type: 'good' | 'warn' | 'tip' };

function getHabitAgeDays(habit: Habit): number {
  return Math.floor((Date.now() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

function getCompletionCount(habit: Habit, target: number, daysAgo: number, windowDays: number): number {
  const today = new Date();
  let count = 0;
  for (let i = daysAgo; i < daysAgo + windowDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toCompletionKey(d);
    if ((habit.completions[key] ?? 0) >= target) count++;
  }
  return count;
}

export function computeTileHint(habit: Habit, completionRate: number, streak: number): TileHint | null {
  const target = Math.max(1, habit.dailyTarget ?? 1);
  const habitAgeDays = getHabitAgeDays(habit);

  if (habitAgeDays < 7) {
    return streak > 0
      ? { iconName: 'sprout', text: `Day ${streak} — great start!`, type: 'good' }
      : { iconName: 'sprout', text: 'New habit — start today!', type: 'tip' };
  }

  const recent7 = getCompletionCount(habit, target, 0, 7);
  const canComparePrev = habitAgeDays >= 14;
  const prev7 = canComparePrev ? getCompletionCount(habit, target, 7, 7) : 0;
  const weekTrend = canComparePrev ? recent7 - prev7 : 0;

  if (completionRate >= 80 && streak >= 5) return { iconName: 'check-circle-2', text: 'On track — great consistency', type: 'good' };
  if (weekTrend >= 3) return { iconName: 'trending-up', text: 'Trending up this week', type: 'good' };
  if (weekTrend <= -3 && recent7 < 3) return { iconName: 'trending-down', text: 'Losing momentum — stay consistent', type: 'warn' };
  if (streak === 0 && completionRate > 20) return { iconName: 'alert-triangle', text: 'Restart your streak today', type: 'warn' };
  if (habitAgeDays >= 30 && completionRate < 40) return { iconName: 'lightbulb', text: 'Try adjusting schedule or goal', type: 'tip' };

  return null;
}
