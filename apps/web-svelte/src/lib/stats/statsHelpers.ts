import type { Habit } from '$lib/types/habit';
import { PERIOD_DISPLAY_NAMES, STREAK_THRESHOLDS, WEEKDAY_NA, STREAK_MESSAGES } from '$lib/constants/stats';
import { formatHabitLabel } from '$lib/habits/formatHabitLabel';

type HabitStats = {
  completionRate: number;
  completedDays: number;
  longestStreak: number;
  currentStreak: number;
  weeklyData: Array<{ count: number }>;
};

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

type PeriodOption = 'week' | 'month' | 'quarter' | 'year';

export function filterStatsHabits(
  habits: Habit[],
  statusFilter: 'all' | 'active' | 'archived',
  searchQuery: string,
  selectedTags: string[]
): Habit[] {
  return habits.filter((habit) => {
    if (statusFilter === 'active' && habit.archived) return false;
    if (statusFilter === 'archived' && !habit.archived) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!habit.name.toLowerCase().includes(query) && !habit.description.toLowerCase().includes(query)) return false;
    }
    if (selectedTags.length > 0 && !(habit.tags || []).some((tag) => selectedTags.includes(tag))) return false;
    return true;
  });
}

export function buildStatsSummary(allStats: HabitStatsEntry[]) {
  const sorted = [...allStats].sort((a, b) => b.stats.completionRate - a.stats.completionRate);
  const totalCompletions = allStats.reduce((sum, { stats }) => sum + stats.completedDays, 0);
  const avgRate = allStats.length > 0
    ? Math.round(allStats.reduce((sum, { stats }) => sum + stats.completionRate, 0) / allStats.length)
    : 0;
  return {
    sorted,
    totalCompletions,
    avgRate,
    bestStreak: Math.max(...allStats.map(({ stats }) => stats.longestStreak), 0),
    currentStreaks: allStats.reduce((sum, { stats }) => sum + (stats.currentStreak > 0 ? 1 : 0), 0)
  };
}

function buildStreakInsight(allStats: HabitStatsEntry[]) {
  const streakLeader = allStats.length > 0
    ? allStats.reduce((best, next) => next.stats.longestStreak > best.stats.longestStreak ? next : best, allStats[0])
    : null;

  let streakBody: string;
  let streakIcon = 'lightbulb';

  if (streakLeader) {
    const days = streakLeader.stats.longestStreak;
    if (days >= STREAK_THRESHOLDS.AUTOMATISM_MIN) {
      streakIcon = 'flame';
      streakBody = STREAK_MESSAGES.AUTOMATISM(formatHabitLabel(streakLeader.habit), days);
    } else if (days >= STREAK_THRESHOLDS.MOMENTUM_MIN) {
      streakIcon = 'dumbbell';
      streakBody = STREAK_MESSAGES.MOMENTUM_ENCOURAGEMENT(days, formatHabitLabel(streakLeader.habit));
    } else if (days > 0) {
      streakIcon = 'sprout';
      streakBody = STREAK_MESSAGES.EARLY_STAGE(days);
    } else {
      streakBody = 'No streaks yet. Complete any habit 3 days in a row to start building a chain.';
    }
  } else {
    streakBody = STREAK_MESSAGES.NO_STREAK;
  }

  return { id: 'streak', title: 'Best streak', body: streakBody, iconName: streakIcon };
}

function buildWeekdayInsight(weekdayStats: WeekdayStats) {
  const bestCount = weekdayStats.counts[weekdayStats.bestIndex] ?? 0;
  const worstCount = weekdayStats.counts[weekdayStats.worstIndex] ?? 0;
  const weekdayDiffPercent = worstCount === 0 ? bestCount * 100 : Math.round(((bestCount - worstCount) / Math.max(1, worstCount)) * 100);
  const hasWeekdayShift = weekdayStats.bestWeekday !== WEEKDAY_NA && weekdayStats.worstWeekday !== WEEKDAY_NA;

  let weekdayBody: string;
  let weekdayIcon = 'bar-chart-2';

  if (hasWeekdayShift) {
    if (weekdayDiffPercent > 50) {
      weekdayIcon = 'alert-triangle';
      weekdayBody = `${weekdayStats.worstWeekday} is your weakest day — try a shorter goal or reminder that day.`;
    } else {
      weekdayBody = `${weekdayDiffPercent}% more completions on ${weekdayStats.bestWeekday} vs ${weekdayStats.worstWeekday}.`;
    }
  } else {
    weekdayBody = 'Check back after a few active days to see your weekday patterns.';
  }

  return { id: 'weekday', title: 'Weekday shift', body: weekdayBody, iconName: weekdayIcon };
}

function buildMomentumInsight(
  habitPeriodData: Array<Record<string, string | number>>,
  filteredHabits: Habit[],
  period: PeriodOption
) {
  const improvedCount = habitPeriodData.length > 1
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
  let momentumIcon = 'lightbulb';

  if (total === 0) {
    momentumBody = 'No habits to measure yet.';
  } else if (improvedCount === total) {
    momentumIcon = 'zap';
    momentumBody = `All ${total} habits improving this ${PERIOD_DISPLAY_NAMES[period]} — excellent momentum!`;
  } else if (improvedCount === 0) {
    momentumIcon = 'trending-down';
    momentumBody = `No habits improved this ${PERIOD_DISPLAY_NAMES[period]}. Focus on one habit to break the trend.`;
  } else {
    momentumIcon = 'trending-up';
    momentumBody = `${improvedCount} of ${total} habits improved. Push the other ${total - improvedCount} forward.`;
  }

  return { id: 'momentum', title: 'Momentum', body: momentumBody, iconName: momentumIcon };
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
    buildMomentumInsight(habitPeriodData, filteredHabits, period)
  ];
}

export function habitStatusLabel(completionRate: number, currentStreak: number, longestStreak: number): { label: string; color: string } {
  if (completionRate >= 80) return { label: 'Excellent', color: 'var(--accent)' };
  if (currentStreak >= longestStreak && longestStreak > 0) return { label: 'Personal best', color: 'var(--accent)' };
  if (longestStreak >= 21) return { label: 'Established', color: 'var(--accent)' };
  if (currentStreak >= 7) return { label: 'Building', color: 'var(--accent-secondary)' };
  if (completionRate >= 50) return { label: 'Consistent', color: 'var(--accent-secondary)' };
  return { label: 'Starting', color: 'var(--text-muted)' };
}

export function buildDailyChartInsight(
  avgRate: number,
  dailyData: { day: string; rate: number }[]
): { iconName: string; text: string; color: string } {
  if (dailyData.length < 3) return { iconName: 'lightbulb', text: 'Track more days to see patterns.', color: 'var(--text-muted)' };
  const recent3 = dailyData.slice(-3).map((d) => d.rate);
  const avg3 = recent3.reduce((s, r) => s + r, 0) / 3;
  const overall = dailyData.map((d) => d.rate).reduce((s, r) => s + r, 0) / dailyData.length;
  const trend = avg3 - overall;
  if (avgRate >= 80) return { iconName: 'check-circle-2', text: 'Consistency is excellent — keep this pace.', color: 'var(--accent)' };
  if (trend > 5) return { iconName: 'trending-up', text: 'Recent days trending up — great momentum.', color: 'var(--accent)' };
  if (trend < -5) return { iconName: 'trending-down', text: 'Recent dip — try habit stacking or a reminder.', color: 'var(--accent-secondary)' };
  if (avgRate < 40) return { iconName: 'alert-triangle', text: 'Low overall rate. Focus on one keystone habit.', color: 'var(--accent-secondary)' };
  return { iconName: 'lightbulb', text: 'Steady progress. Consistency compounds over time.', color: 'var(--text-muted)' };
}

export function parseQuarterPeriodLabel(label: string): { monthLabel: string; weekLabel: string } {
  const parts = label.split(' · ');
  return { monthLabel: parts[0] || '', weekLabel: parts[1] || '' };
}

export function formatQuarterWeekLabel(weekLabel: string): string {
  const match = weekLabel.match(/Week (\d+)/);
  return match ? `W${match[1]}` : weekLabel;
}

export function buildQuarterTickMeta(labels: string[]): Map<number, { isMonthStart: boolean; monthLabel: string }> {
  const meta = new Map<number, { isMonthStart: boolean; monthLabel: string }>();
  let lastMonthLabel = '';
  for (let i = 0; i < labels.length; i++) {
    const { monthLabel } = parseQuarterPeriodLabel(labels[i]);
    const isMonthStart = monthLabel !== lastMonthLabel;
    if (isMonthStart) lastMonthLabel = monthLabel;
    meta.set(i, { isMonthStart, monthLabel });
  }
  return meta;
}
