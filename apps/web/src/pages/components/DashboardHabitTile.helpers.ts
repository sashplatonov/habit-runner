import type { LucideIcon } from 'lucide-react';
import { toCompletionKey } from '@/lib/completionKey';
import type { Habit } from '@/types/habit';
import { AlertTriangleIcon, CheckCircle2Icon, LightbulbIcon, SproutIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

export type TileHint = { icon: LucideIcon; text: string; type: 'good' | 'warn' | 'tip' };

function getHabitAgeDays(habit: Habit): number {
  const today = new Date();
  return Math.floor((today.getTime() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

function getCompletionCount(habit: Habit, target: number, daysAgo: number, windowDays: number): number {
  const today = new Date();
  let count = 0;
  for (let i = daysAgo; i < daysAgo + windowDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toCompletionKey(d);
    if ((habit.completions[key] ?? 0) >= target) {
      count++;
    }
  }
  return count;
}

function buildNewHabitHint(streak: number): TileHint {
  if (streak > 0) {
    return { icon: SproutIcon, text: `Day ${streak} — great start!`, type: 'good' };
  }
  return { icon: SproutIcon, text: 'New habit — start today!', type: 'tip' };
}

function buildConsistencyHint(completionRate: number, streak: number): TileHint | null {
  if (completionRate >= 80 && streak >= 5) {
    return { icon: CheckCircle2Icon, text: 'On track — great consistency', type: 'good' };
  }
  return null;
}

function buildTrendHint(weekTrend: number, recent7: number): TileHint | null {
  if (weekTrend >= 3) {
    return { icon: TrendingUpIcon, text: 'Trending up this week', type: 'good' };
  }
  if (weekTrend <= -3 && recent7 < 3) {
    return { icon: TrendingDownIcon, text: 'Losing momentum — stay consistent', type: 'warn' };
  }
  return null;
}

function buildRestartHint(streak: number, completionRate: number): TileHint | null {
  if (streak === 0 && completionRate > 20) {
    return { icon: AlertTriangleIcon, text: 'Restart your streak today', type: 'warn' };
  }
  return null;
}

function buildAdjustmentHint(habitAgeDays: number, completionRate: number): TileHint | null {
  if (habitAgeDays >= 30 && completionRate < 40) {
    return { icon: LightbulbIcon, text: 'Try adjusting schedule or goal', type: 'tip' };
  }
  return null;
}

export function computeTileHint(habit: Habit, completionRate: number, streak: number): TileHint | null {
  const target = Math.max(1, habit.dailyTarget ?? 1);
  const habitAgeDays = getHabitAgeDays(habit);

  if (habitAgeDays < 7) {
    return buildNewHabitHint(streak);
  }

  const recent7 = getCompletionCount(habit, target, 0, 7);
  const canComparePrev = habitAgeDays >= 14;
  const prev7 = canComparePrev ? getCompletionCount(habit, target, 7, 7) : 0;
  const weekTrend = canComparePrev ? recent7 - prev7 : 0;

  const consistencyHint = buildConsistencyHint(completionRate, streak);
  if (consistencyHint) {
    return consistencyHint;
  }

  const trendHint = buildTrendHint(weekTrend, recent7);
  if (trendHint) {
    return trendHint;
  }

  const restartHint = buildRestartHint(streak, completionRate);
  if (restartHint) {
    return restartHint;
  }

  const adjustmentHint = buildAdjustmentHint(habitAgeDays, completionRate);
  if (adjustmentHint) {
    return adjustmentHint;
  }

  return null;
}
