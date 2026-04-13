import type { LucideIcon } from 'lucide-react';
import { AlertTriangleIcon, BarChart2Icon, DumbbellIcon, FlameIcon, LightbulbIcon, SproutIcon, TrendingDownIcon, TrendingUpIcon, ZapIcon } from 'lucide-react';
import type { Habit, HabitStats } from '@/types/habit';
import type { PeriodOption } from './components/StatsView';
import { PERIOD_DISPLAY_NAMES, STREAK_THRESHOLDS, WEEKDAY_NA, STREAK_MESSAGES } from '@/lib/constants/stats';
import { formatHabitLabel } from '@/lib/habits/formatHabitLabel';

type HabitStatsEntry = {
  habit: Habit;
  stats: HabitStats;
};

type WeekdayStats = {
  bestWeekday: string;
  worstWeekday: string;
  bestIndex: number;
  worstIndex: number;
  counts: number[];
};

export function filterStatsHabits(
  habits: Habit[],
  statusFilter: 'all' | 'active' | 'archived',
  searchQuery: string,
  selectedTags: string[]
): Habit[] {
  return habits.filter((habit) => {
    if (statusFilter === 'active' && habit.archived) {
      return false;
    }
    if (statusFilter === 'archived' && !habit.archived) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!habit.name.toLowerCase().includes(query) && !habit.description.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (selectedTags.length > 0 && !(habit.tags || []).some((tag) => selectedTags.includes(tag))) {
      return false;
    }
    return true;
  });
}

export function buildStatsSummary(allStats: HabitStatsEntry[]) {
  const sorted = [...allStats].sort((a, b) => b.stats.completionRate - a.stats.completionRate);
  const totalCompletions = allStats.reduce((sum, { stats }) => sum + stats.completedDays, 0);
  const avgRate =
    allStats.length > 0
      ? Math.round(allStats.reduce((sum, { stats }) => sum + stats.completionRate, 0) / allStats.length)
      : 0;

  return {
    sorted,
    totalCompletions,
    avgRate,
    bestStreak: Math.max(...allStats.map(({ stats }) => stats.longestStreak), 0),
    currentStreaks: allStats.reduce((sum, { stats }) => sum + (stats.currentStreak > 0 ? 1 : 0), 0),
  };
}

function buildStreakInsight(allStats: HabitStatsEntry[]): {
  icon: LucideIcon;
  title: string;
  body: string;
  id: string;
} {
  const streakLeader =
    allStats.length > 0
      ? allStats.reduce((best, next) =>
          next.stats.longestStreak > best.stats.longestStreak ? next : best,
        allStats[0])
      : null;

  let streakBody: string;
  let streakIcon = LightbulbIcon;

  if (streakLeader) {
    const days = streakLeader.stats.longestStreak;
    if (days >= STREAK_THRESHOLDS.AUTOMATISM_MIN) {
      streakIcon = FlameIcon;
      streakBody = STREAK_MESSAGES.AUTOMATISM(formatHabitLabel(streakLeader.habit), days);
    } else if (days >= STREAK_THRESHOLDS.MOMENTUM_MIN) {
      streakIcon = DumbbellIcon;
      streakBody = STREAK_MESSAGES.MOMENTUM_ENCOURAGEMENT(days, formatHabitLabel(streakLeader.habit));
    } else if (days > 0) {
      streakIcon = SproutIcon;
      streakBody = STREAK_MESSAGES.EARLY_STAGE(days);
    } else {
      streakBody = 'No streaks yet. Complete any habit 3 days in a row to start building a chain.';
    }
  } else {
    streakBody = STREAK_MESSAGES.NO_STREAK;
  }

  return {
    id: 'streak',
    title: 'Best streak',
    body: streakBody,
    icon: streakIcon,
  };
}

function buildWeekdayInsight(weekdayStats: WeekdayStats): {
  icon: LucideIcon;
  title: string;
  body: string;
  id: string;
} {
  const bestCount = weekdayStats.counts[weekdayStats.bestIndex] ?? 0;
  const worstCount = weekdayStats.counts[weekdayStats.worstIndex] ?? 0;
  const weekdayDiffPercent =
    worstCount === 0 ? bestCount * 100 : Math.round(((bestCount - worstCount) / Math.max(1, worstCount)) * 100);
  const hasWeekdayShift = weekdayStats.bestWeekday !== WEEKDAY_NA && weekdayStats.worstWeekday !== WEEKDAY_NA;

  let weekdayBody: string;
  let weekdayIcon = BarChart2Icon;

  if (hasWeekdayShift) {
    if (weekdayDiffPercent > 50) {
      weekdayIcon = AlertTriangleIcon;
      weekdayBody = `${weekdayStats.worstWeekday} is your weakest day — try a shorter goal or reminder that day.`;
    } else {
      weekdayBody = `${weekdayDiffPercent}% more completions on ${weekdayStats.bestWeekday} vs ${weekdayStats.worstWeekday}.`;
    }
  } else {
    weekdayBody = 'Check back after a few active days to see your weekday patterns.';
  }

  return {
    id: 'weekday',
    title: 'Weekday shift',
    body: weekdayBody,
    icon: weekdayIcon,
  };
}

function buildMomentumInsight(
  habitPeriodData: Array<Record<string, string | number>>,
  filteredHabits: Habit[],
  period: PeriodOption
): {
  icon: LucideIcon;
  title: string;
  body: string;
  id: string;
} {
  const improvedCount =
    habitPeriodData.length > 1
      ? filteredHabits.reduce((sum, habit) => {
          const lastEntry = habitPeriodData[habitPeriodData.length - 1];
          const prevEntry = habitPeriodData[habitPeriodData.length - 2];
          const current = Number(lastEntry?.[habit.name] ?? 0);
          const previous = Number(prevEntry?.[habit.name] ?? 0);
          return current > previous ? sum + 1 : sum;
        }, 0)
      : 0;

  const total = filteredHabits.length;
  let momentumBody: string;
  let momentumIcon = LightbulbIcon;

  if (total === 0) {
    momentumBody = 'No habits to measure yet.';
  } else if (improvedCount === total) {
    momentumIcon = ZapIcon;
    momentumBody = `All ${total} habits improving this ${PERIOD_DISPLAY_NAMES[period]} — excellent momentum!`;
  } else if (improvedCount === 0) {
    momentumIcon = TrendingDownIcon;
    momentumBody = `No habits improved this ${PERIOD_DISPLAY_NAMES[period]}. Focus on one habit to break the trend.`;
  } else {
    momentumIcon = TrendingUpIcon;
    momentumBody = `${improvedCount} of ${total} habits improved. Push the other ${total - improvedCount} forward.`;
  }

  return {
    id: 'momentum',
    title: 'Momentum',
    body: momentumBody,
    icon: momentumIcon,
  };
}

export function buildStatsInsights(
  allStats: HabitStatsEntry[],
  weekdayStats: WeekdayStats,
  habitPeriodData: Array<Record<string, string | number>>,
  filteredHabits: Habit[],
  period: PeriodOption
) {
  return [
    buildStreakInsight(allStats),
    buildWeekdayInsight(weekdayStats),
    buildMomentumInsight(habitPeriodData, filteredHabits, period),
  ];
}
