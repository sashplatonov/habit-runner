import { useEffect, useMemo, useState } from 'react';
import { AlertTriangleIcon, BarChart2Icon, DumbbellIcon, FlameIcon, LightbulbIcon, SproutIcon, TrendingDownIcon, TrendingUpIcon, ZapIcon } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { formatAppDate } from '@/lib/i18n';
import { toCompletionKey } from '@/lib/completionKey';
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

function formatHabitLabel(habit: Habit) {
  return habit.icon ? `${habit.icon} ${habit.name}` : habit.name;
}

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
  let streakIcon = LightbulbIcon;
  if (streakLeader) {
    const days = streakLeader.stats.longestStreak;
    if (days >= 21) {
      streakIcon = FlameIcon;
      streakBody = `${formatHabitLabel(streakLeader.habit)} has ${days} days — this habit is becoming automatic.`;
    } else if (days >= 7) {
      streakIcon = DumbbellIcon;
      streakBody = `${days} days on ${formatHabitLabel(streakLeader.habit)}. Aim for 21+ to build lasting automatism.`;
    } else if (days > 0) {
      streakIcon = SproutIcon;
      streakBody = `Best streak is ${days} days. Complete any habit 7 days in a row to build momentum.`;
    } else {
      streakBody = 'No streaks yet. Complete any habit 3 days in a row to start building a chain.';
    }
  } else {
    streakBody = 'No streaks registered yet.';
  }

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

  return [
    { id: 'streak', title: 'Best streak', body: streakBody, icon: streakIcon },
    { id: 'weekday', title: 'Weekday shift', body: weekdayBody, icon: weekdayIcon },
    { id: 'momentum', title: 'Momentum', body: momentumBody, icon: momentumIcon }
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

  const [hiddenHabits, setHiddenHabits] = useState<string[]>([]);
  const visibleHabits = useMemo(
    () => filteredHabits.filter((habit) => !hiddenHabits.includes(habit.name)),
    [filteredHabits, hiddenHabits]
  );
  useEffect(() => {
    setHiddenHabits((prev) => {
      const allowed = new Set(filteredHabits.map((habit) => habit.name));
      const next = prev.filter((name) => allowed.has(name));
      return next.length === prev.length ? prev : next;
    });
  }, [filteredHabits]);

  const windowRange = useMemo(() => getWindowRange(period), [period]);
  const periodDayCount = PERIOD_DAY_RANGES[period] ?? 30;
  const periodSegments = useMemo(() => buildPeriodSegments(period, periodDayCount), [period, periodDayCount]);

  const allStats = useMemo(
    () => filteredHabits.map((h) => ({ habit: h, stats: getHabitStats(h.id) })),
    [filteredHabits, getHabitStats]
  );

  const dailyData = useMemo(
    () => generateDailyCompletionData(visibleHabits, windowRange.start, windowRange.end, period, periodSegments),
    [visibleHabits, windowRange, period, periodSegments]
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

  const dailyHabitDetails = useMemo(() => {
    const details: Record<string, string[]> = {};
    filteredHabits.forEach((habit) => {
      const threshold = getCompletionThreshold(habit);
      Object.entries(habit.completions).forEach(([date, count]) => {
        if (count >= threshold) {
          if (!details[date]) {
            details[date] = [];
          }
          const label = formatHabitLabel(habit);
          details[date].push(label);
        }
      });
    });
    return details;
  }, [filteredHabits]);

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

  const toggleHabitVisibility = (name: string) => {
    setHiddenHabits((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
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
      dailyHabitDetails={dailyHabitDetails}
      sorted={summary.sorted}
      allStats={allStats}
      bestWeekday={weekdayStats.bestWeekday}
      worstWeekday={weekdayStats.worstWeekday}
      investmentPercent={weekdayStats.investmentPercent}
      totalActiveDays={weekdayStats.totalActiveDays}
      period={period}
      setPeriod={setPeriod}
      insights={insights}
      hiddenHabits={hiddenHabits}
      toggleHabitVisibility={toggleHabitVisibility}
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

function formatSegmentLabel(date: Date, period: Period) {
  switch (period) {
    case 'week':
      return formatAppDate(date, { weekday: 'short' });
    case 'month':
      return formatAppDate(date, { month: 'short', day: 'numeric' });
    case 'quarter':
      return formatAppDate(date, { month: 'short', day: 'numeric' });
    case 'year':
      return formatAppDate(date, { month: 'short', day: 'numeric', year: '2-digit' });
    default:
      return formatAppDate(date, { month: 'short', day: 'numeric' });
  }
}

function buildPeriodSegments(period: Period, days: number): PeriodSegment[] {
  const dailySegments = buildDailySegments(period, days);

  if (period === 'quarter') {
    return groupSegmentsByWeekByMonth(dailySegments);
  }

  if (period === 'year') {
    return groupSegmentsByMonth(dailySegments);
  }

  return dailySegments;
}

function buildDailySegments(period: Period, days: number): PeriodSegment[] {
  const segments: PeriodSegment[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let offset = days - 1; offset >= 0; offset--) {
    const start = new Date(today);
    start.setDate(start.getDate() - offset);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    segments.push({
      start,
      end,
      label: formatSegmentLabel(start, period)
    });
  }
  return segments;
}

function groupSegmentsByMonth(segments: PeriodSegment[]): PeriodSegment[] {
  if (segments.length === 0) {
    return segments;
  }
  const grouped: PeriodSegment[] = [];
  let cursor = 0;

  while (cursor < segments.length) {
    const { start } = segments[cursor];
    const keyMonth = start.getMonth();
    const keyYear = start.getFullYear();
    let endIndex = cursor + 1;
    while (endIndex < segments.length) {
      const next = segments[endIndex].start;
      if (next.getMonth() !== keyMonth || next.getFullYear() !== keyYear) {
        break;
      }
      endIndex += 1;
    }
    const chunk = segments.slice(cursor, endIndex);
    const last = chunk[chunk.length - 1];
    grouped.push({
      start,
      end: last.end,
      label: formatAppDate(start, { month: 'short', year: 'numeric' })
    });
    cursor = endIndex;
  }

  return grouped;
}

function groupSegmentsByWeekByMonth(segments: PeriodSegment[]): PeriodSegment[] {
  if (segments.length === 0) {
    return segments;
  }
  const grouped: PeriodSegment[] = [];
  let cursor = 0;

  while (cursor < segments.length) {
    const { start } = segments[cursor];
    const keyMonth = start.getMonth();
    const keyYear = start.getFullYear();
    const monthSegments: PeriodSegment[] = [];

    while (cursor < segments.length) {
      const current = segments[cursor];
      if (current.start.getMonth() !== keyMonth || current.start.getFullYear() !== keyYear) {
        break;
      }
      monthSegments.push(current);
      cursor += 1;
    }

    const monthLabel = formatAppDate(monthSegments[0].start, { month: 'short', year: '2-digit' });
    let weekNumber = 1;
    for (let i = 0; i < monthSegments.length; i += 7) {
      const chunk = monthSegments.slice(i, i + 7);
      const last = chunk[chunk.length - 1];
      grouped.push({
        start: chunk[0].start,
        end: last.end,
        label: `${monthLabel} · Week ${weekNumber}`
      });
      weekNumber += 1;
    }
  }

  return grouped;
}

function differenceInDays(later: Date, earlier: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((later.getTime() - earlier.getTime()) / msPerDay);
}


function getCompletionThreshold(habit: Habit) {
  return Math.max(1, habit.dailyTarget ?? 1);
}

function generateDailyCompletionData(
  habits: Habit[],
  start: Date,
  end: Date,
  period: Period,
  segments: PeriodSegment[]
) {
  if (period === 'week' || period === 'month') {
    const total = habits.length;
    const length = differenceInDays(end, start) + 1;
    return Array.from({ length }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = toCompletionKey(date);
      const completed = habits.filter((h) => (h.completions[key] ?? 0) >= getCompletionThreshold(h)).length;
      return {
        day: formatAppDate(date, { month: 'short', day: 'numeric' }),
        axisLabel: period === 'week' ? formatAppDate(date, { weekday: 'short' }) : formatAppDate(date, { month: 'short', day: 'numeric' }),
        completed,
        total,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });
  }

  return segments.map((segment) => {
    const spanDays = Math.max(1, differenceInDays(segment.end, segment.start));
    let completed = 0;
    for (let cursor = new Date(segment.start); cursor < segment.end; cursor.setDate(cursor.getDate() + 1)) {
      const key = toCompletionKey(cursor);
      const completedToday = habits.filter((h) => (h.completions[key] ?? 0) >= getCompletionThreshold(h)).length;
      completed += completedToday;
    }
    const total = habits.length * spanDays;
    return {
      day: segment.label,
      axisLabel: segment.label,
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
        const key = toCompletionKey(cursor);
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
    const key = toCompletionKey(date);
    const isCompleted = habits.some((habit) => (habit.completions[key] ?? 0) >= getCompletionThreshold(habit));
    if (isCompleted) {
      counts[date.getDay()] += 1;
      activeDays.add(key);
    }
  }
  let bestIndex = 0;
  let worstIndex = -1;
  for (let i = 0; i < 7; i++) {
    if (counts[i] > counts[bestIndex]) {
      bestIndex = i;
    }
    if (counts[i] > 0 && (worstIndex === -1 || counts[i] < counts[worstIndex])) {
      worstIndex = i;
    }
  }
  const totalActiveDays = activeDays.size;
  const investmentPercent = Math.round((totalActiveDays / Math.max(1, spanDays)) * 100);
  const resolvedWorstIndex = worstIndex >= 0 ? worstIndex : bestIndex;
  return {
    bestWeekday: counts[bestIndex] > 0 ? WEEKDAY_NAMES[bestIndex] : 'N/A',
    worstWeekday: worstIndex >= 0 ? WEEKDAY_NAMES[worstIndex] : 'N/A',
    bestIndex,
    worstIndex: resolvedWorstIndex,
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
      const key = toCompletionKey(date);
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
