import { useMemo, useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { formatAppDate } from '@/lib/i18n';
import { useNavigate } from '@/lib/router';
import { StatsView } from './components/StatsView';
import type { Habit } from '@/types/habit';
import type { PeriodOption } from './components/StatsView';

type Period = PeriodOption;

const PERIOD_DAY_RANGES: Record<PeriodOption, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365
};

const PERIOD_DISPLAY_NAMES: Record<PeriodOption, string> = {
  week: 'week',
  month: 'month',
  quarter: 'quarter',
  year: 'year'
};

type HabitStatsEntry = {
  habit: Habit;
  stats: ReturnType<ReturnType<typeof useHabits>['getHabitStats']>;
};

function filterStatsHabits(
  habits: Habit[],
  statusFilter: 'all' | 'active' | 'archived',
  searchQuery: string,
  selectedTags: string[]
) {
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

function buildStatsSummary(allStats: HabitStatsEntry[]) {
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
    currentStreaks: allStats.reduce((sum, { stats }) => sum + (stats.currentStreak > 0 ? 1 : 0), 0)
  };
}

function buildStatsInsights(
  allStats: HabitStatsEntry[],
  weekdayStats: WeekdayStats,
  habitPeriodData: Array<Record<string, string | number>>,
  filteredHabits: Habit[],
  period: PeriodOption
) {
  const streakLeader =
    allStats.length > 0
      ? allStats.reduce((best, next) =>
          next.stats.longestStreak > best.stats.longestStreak ? next : best,
        allStats[0])
      : null;
  const bestCount = weekdayStats.counts[weekdayStats.bestIndex] ?? 0;
  const worstCount = weekdayStats.counts[weekdayStats.worstIndex] ?? 0;
  const weekdayDiffPercent =
    worstCount === 0 ? bestCount * 100 : Math.round(((bestCount - worstCount) / Math.max(1, worstCount)) * 100);
  const hasWeekdayShift = weekdayStats.bestWeekday !== 'N/A' && weekdayStats.worstWeekday !== 'N/A';
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

  let streakBody: string;
  if (streakLeader) {
    const days = streakLeader.stats.longestStreak;
    if (days >= 21) {
      streakBody = `🔥 ${streakLeader.habit.name} has ${days} days — this habit is becoming automatic.`;
    } else if (days >= 7) {
      streakBody = `💪 ${days} days on ${streakLeader.habit.name}. Aim for 21+ to build lasting automatism.`;
    } else if (days > 0) {
      streakBody = `🌱 Best streak is ${days} days. Complete any habit 7 days in a row to build momentum.`;
    } else {
      streakBody = '💡 No streaks yet. Complete any habit 3 days in a row to start building a chain.';
    }
  } else {
    streakBody = '💡 No streaks registered yet.';
  }

  let weekdayBody: string;
  if (hasWeekdayShift) {
    if (weekdayDiffPercent > 50) {
      weekdayBody = `⚠️ ${weekdayStats.worstWeekday} is your weakest day — try a shorter goal or reminder that day.`;
    } else {
      weekdayBody = `📊 ${weekdayDiffPercent}% more completions on ${weekdayStats.bestWeekday} vs ${weekdayStats.worstWeekday}.`;
    }
  } else {
    weekdayBody = '📊 Check back after a few active days to see your weekday patterns.';
  }

  const total = filteredHabits.length;
  let momentumBody: string;
  if (total === 0) {
    momentumBody = '💡 No habits to measure yet.';
  } else if (improvedCount === total) {
    momentumBody = `🚀 All ${total} habits improving this ${PERIOD_DISPLAY_NAMES[period]} — excellent momentum!`;
  } else if (improvedCount === 0) {
    momentumBody = `📉 No habits improved this ${PERIOD_DISPLAY_NAMES[period]}. Focus on one habit to break the trend.`;
  } else {
    momentumBody = `📈 ${improvedCount} of ${total} habits improved. Push the other ${total - improvedCount} forward.`;
  }

  return [
    { id: 'streak', title: 'Best streak', body: streakBody },
    { id: 'weekday', title: 'Weekday shift', body: weekdayBody },
    { id: 'momentum', title: 'Momentum', body: momentumBody }
  ];
}

export function Stats() {
  const navigate = useNavigate();
  const { allHabits, getHabitStats } = useHabits();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [period, setPeriod] = useState<PeriodOption>('month');

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allHabits.forEach((h) => (h.tags || []).forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [allHabits]);

  const filteredHabits = useMemo(
    () => filterStatsHabits(allHabits, statusFilter, searchQuery, selectedTags),
    [allHabits, statusFilter, searchQuery, selectedTags]
  );

  const windowRange = useMemo(() => getWindowRange(period), [period]);
  const periodSegments = useMemo(() => buildPeriodSegments(period, 6), [period]);

  const allStats = useMemo(
    () => filteredHabits.map((h) => ({ habit: h, stats: getHabitStats(h.id) })),
    [filteredHabits, getHabitStats]
  );

  const dailyData = useMemo(
    () => generateDailyCompletionData(filteredHabits, windowRange.start, windowRange.end),
    [filteredHabits, windowRange]
  );

  const habitPeriodData = useMemo(
    () => generateHabitPeriodData(filteredHabits, periodSegments),
    [filteredHabits, periodSegments]
  );

  const summary = useMemo(() => buildStatsSummary(allStats), [allStats]);

  const weekdayStats = useMemo(
    () => buildWeekdayStats(filteredHabits, windowRange.start, windowRange.end),
    [filteredHabits, windowRange]
  );

  const frozenDates = useMemo(() => {
    const frozen = new Set<string>();
    allHabits.forEach(h => {
      (h.freezeDays ?? []).forEach(dateStr => {
        frozen.add(dateStr);
      });
    });
    return frozen;
  }, [allHabits]);

  const activityWeeks = useMemo(
    () => buildActivityWeeks(filteredHabits, frozenDates, windowRange.start, windowRange.end),
    [filteredHabits, frozenDates, windowRange]
  );

  const insights = useMemo(
    () => buildStatsInsights(allStats, weekdayStats, habitPeriodData, filteredHabits, period),
    [allStats, weekdayStats, habitPeriodData, filteredHabits, period]
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  return (
    <StatsView
      navigate={navigate}
      avgRate={summary.avgRate}
      bestStreak={summary.bestStreak}
      totalCompletions={summary.totalCompletions}
      currentStreaks={summary.currentStreaks}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      allTags={allTags}
      selectedTags={selectedTags}
      toggleTag={toggleTag}
      dailyData={dailyData}
      habitPeriodData={habitPeriodData}
      filteredHabits={filteredHabits}
      sorted={summary.sorted}
      allStats={allStats}
      bestWeekday={weekdayStats.bestWeekday}
      worstWeekday={weekdayStats.worstWeekday}
      investmentPercent={weekdayStats.investmentPercent}
      totalActiveDays={weekdayStats.totalActiveDays}
      period={period}
      setPeriod={setPeriod}
      insights={insights}
      activityWeeks={activityWeeks}
    />
  );
}

type PeriodSegment = {
  start: Date;
  end: Date;
  label: string;
};

type WeekdayStats = {
  bestWeekday: string;
  worstWeekday: string;
  bestIndex: number;
  worstIndex: number;
  counts: number[];
  investmentPercent: number;
  totalActiveDays: number;
};

type ActivityDay = {
  date: string;
  intensity: number;
  isFrozen: boolean;
  inWindow: boolean;
};

type ActivityWeek = {
  label: string;
  days: ActivityDay[];
};

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWindowRange(period: Period) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  const windowLength = PERIOD_DAY_RANGES[period] ?? 30;
  start.setDate(end.getDate() - (windowLength - 1));
  return { start, end };
}

function alignPeriodStart(date: Date, period: Period) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  switch (period) {
    case 'week': {
      const offset = (copy.getDay() + 6) % 7;
      copy.setDate(copy.getDate() - offset);
      return copy;
    }
    case 'month':
      return new Date(copy.getFullYear(), copy.getMonth(), 1);
    case 'quarter': {
      const quarterStart = Math.floor(copy.getMonth() / 3) * 3;
      return new Date(copy.getFullYear(), quarterStart, 1);
    }
    case 'year':
      return new Date(copy.getFullYear(), 0, 1);
    default:
      return copy;
  }
}

function shiftPeriod(date: Date, period: Period, delta: number) {
  const copy = new Date(date);
  switch (period) {
    case 'week':
      copy.setDate(copy.getDate() + delta * 7);
      break;
    case 'month':
      copy.setMonth(copy.getMonth() + delta);
      break;
    case 'quarter':
      copy.setMonth(copy.getMonth() + delta * 3);
      break;
    case 'year':
      copy.setFullYear(copy.getFullYear() + delta);
      break;
  }
  return alignPeriodStart(copy, period);
}

function formatSegmentLabel(start: Date, period: Period) {
  switch (period) {
    case 'week':
      return formatAppDate(start, { month: 'short', day: 'numeric' });
    case 'month':
      return formatAppDate(start, { month: 'short' });
    case 'quarter': {
      const quarter = Math.floor(start.getMonth() / 3) + 1;
      return `Q${quarter} '${String(start.getFullYear()).slice(-2)}`;
    }
    case 'year':
      return `${start.getFullYear()}`;
    default:
      return formatAppDate(start, { month: 'short', day: 'numeric' });
  }
}

function buildPeriodSegments(period: Period, count: number): PeriodSegment[] {
  const segments: PeriodSegment[] = [];
  const now = new Date();
  const currentStart = alignPeriodStart(now, period);
  for (let idx = 0; idx < count; idx++) {
    const offset = idx - (count - 1);
    const start = shiftPeriod(currentStart, period, offset);
    const end = shiftPeriod(start, period, 1);
    segments.push({
      start,
      end,
      label: formatSegmentLabel(start, period)
    });
  }
  return segments;
}

function differenceInDays(later: Date, earlier: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((later.getTime() - earlier.getTime()) / msPerDay);
}

function getCompletionThreshold(habit: Habit) {
  return Math.max(1, habit.dailyTarget ?? 1);
}

function generateDailyCompletionData(habits: Habit[], start: Date, end: Date) {
  const total = habits.length;
  const length = differenceInDays(end, start) + 1;
  return Array.from({ length }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().split('T')[0];
    const completed = habits.filter((h) => (h.completions[key] ?? 0) >= getCompletionThreshold(h)).length;
    return {
      day: formatAppDate(date, { month: 'short', day: 'numeric' }),
      completed,
      total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  });
}

function generateHabitPeriodData(habits: Habit[], segments: PeriodSegment[]) {
  return segments.map((segment) => {
    const entry: Record<string, string | number> = { period: segment.label };
    const spanDays = Math.max(1, differenceInDays(segment.end, segment.start));
    habits.forEach((habit) => {
      let completed = 0;
      for (let cursor = new Date(segment.start); cursor < segment.end; cursor.setDate(cursor.getDate() + 1)) {
        const key = cursor.toISOString().split('T')[0];
        if ((habit.completions[key] ?? 0) >= getCompletionThreshold(habit)) {
          completed++;
        }
      }
      entry[habit.name] = Math.round((completed / spanDays) * 100);
    });
    return entry;
  });
}

function buildWeekdayStats(habits: Habit[], start: Date, end: Date): WeekdayStats {
  const counts = Array(7).fill(0);
  const activeDays = new Set<string>();
  const spanDays = differenceInDays(end, start) + 1;
  for (let offset = 0; offset < spanDays; offset++) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const key = date.toISOString().split('T')[0];
    const completed = habits.some((habit) => (habit.completions[key] ?? 0) >= getCompletionThreshold(habit))
      ? 1
      : 0;
    if (completed) {
      counts[date.getDay()] += 1;
      activeDays.add(key);
    }
  }
  let bestIndex = 1;
  let worstIndex = 1;
  for (let i = 0; i < 7; i++) {
    if (counts[i] > counts[bestIndex]) {
      bestIndex = i;
    }
    if (counts[i] < counts[worstIndex] && counts[i] > 0) {
      worstIndex = i;
    }
  }
  const totalActiveDays = activeDays.size;
  const investmentPercent = Math.round((totalActiveDays / Math.max(1, spanDays)) * 100);
  return {
    bestWeekday: counts[bestIndex] > 0 ? WEEKDAY_NAMES[bestIndex] : 'N/A',
    worstWeekday: counts[worstIndex] > 0 ? WEEKDAY_NAMES[worstIndex] : 'N/A',
    bestIndex,
    worstIndex,
    counts,
    investmentPercent,
    totalActiveDays
  };
}

function buildActivityWeeks(
  habits: Habit[],
  frozenDates: Set<string>,
  rangeStart: Date,
  rangeEnd: Date
): ActivityWeek[] {
  const start = new Date(rangeStart);
  const startOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - startOffset);
  start.setHours(0, 0, 0, 0);
  const spanDays = differenceInDays(rangeEnd, start) + 1;
  const columns = Math.ceil(spanDays / 7);
  const weeks: ActivityWeek[] = [];
  for (let col = 0; col < columns; col++) {
    const columnDays: ActivityDay[] = [];
    for (let row = 0; row < 7; row++) {
      const index = col * 7 + row;
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = date.toISOString().split('T')[0];
      const inWindow = date >= rangeStart && date <= rangeEnd;
      const intensity = inWindow
        ? habits.filter((habit) => (habit.completions[key] ?? 0) >= getCompletionThreshold(habit)).length
        : 0;
      columnDays.push({
        date: key,
        intensity,
        isFrozen: inWindow && frozenDates.has(key),
        inWindow
      });
    }
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + col * 7);
    weeks.push({
      label: formatAppDate(weekStart, { month: 'short', day: 'numeric' }),
      days: columnDays
    });
  }
  return weeks;
}
