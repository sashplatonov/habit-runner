<script lang="ts">
  import { goto } from '$app/navigation';
  import { habitsStore, getHabitStats, formatDate } from '$lib/stores/habitsStore';
  import { toCompletionKey } from '$lib/completionKey';
  import { formatAppDate } from '$lib/i18n';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
  import { PERIOD_DAY_RANGES, PERIOD_DISPLAY_NAMES, WEEKDAY_NA } from '$lib/constants/stats';
  import { OVERVIEW_SIGNALS_TOOLTIP, YOUR_INVESTMENT_TOOLTIP, INSIGHTS_TOOLTIP } from '$lib/constants/blockGuideTooltips';
  import {
    filterStatsHabits,
    buildStatsSummary,
    buildStatsInsights,
    habitStatusLabel,
    buildDailyChartInsight,
    buildQuarterTickMeta,
    parseQuarterPeriodLabel,
    formatQuarterWeekLabel
  } from '$lib/stats/statsHelpers';
  import { getInvestmentColor, getInvestmentMessage } from '$lib/stats/StatsView.helpers';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
  import HabitHeatmap from '$lib/components/HabitHeatmap.svelte';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import type { Habit, HabitStats } from '$lib/types/habit';

  // ─── Types ───
  type PeriodOption = 'week' | 'month' | 'quarter' | 'year';
  type TabId = 'overview' | 'charts' | 'habits' | 'activity';
  type PeriodSegment = { start: Date; end: Date; label: string };
  type WeekdayStats = { bestWeekday: string; worstWeekday: string; bestIndex: number; worstIndex: number; counts: number[]; investmentPercent: number; totalActiveDays: number };
  type ActivityDay = { date: string; intensity: number; isFrozen: boolean; inWindow: boolean };
  type ActivityWeek = { label: string; days: ActivityDay[] };
  type DailyDataPoint = { day: string; axisLabel: string; completed: number; total: number; rate: number };

  const TABS: Array<{ id: TabId; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'charts', label: 'Charts' },
    { id: 'habits', label: 'Habits' },
    { id: 'activity', label: 'Activity' }
  ];

  const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const PERIOD_OPTIONS: Array<{ id: PeriodOption; label: string }> = [
    { id: 'week', label: 'W' },
    { id: 'month', label: 'M' },
    { id: 'quarter', label: 'Q' },
    { id: 'year', label: 'Y' }
  ];

  // ─── State ───
  let activeTab = $state<TabId>('overview');
  let filtersOpen = $state(false);
  let statusFilter = $state<'all' | 'active' | 'archived'>('all');
  let searchQuery = $state('');
  let selectedTags = $state<string[]>([]);
  let period = $state<PeriodOption>('month');
  let hiddenHabits = $state<string[]>([]);
  let habitSort = $state<'rate' | 'streak' | 'name'>('rate');
  let habitSortDir = $state<'desc' | 'asc'>('desc');

  const allHabits = $derived($habitsStore);
  const allHabitsRaw = $derived((allHabits ?? []) as Habit[]);

  // ─── Derived data ───
  const filteredHabits = $derived(filterStatsHabits(allHabitsRaw, statusFilter, searchQuery, selectedTags));
  const visibleHabits = $derived(filteredHabits.filter((h) => !hiddenHabits.includes(h.name)));
  const allTags = $derived([...new Set(allHabitsRaw.flatMap((h) => h.tags || []))].sort());

  const allStats = $derived(
    filteredHabits.map((habit) => ({
      habit,
      stats: getHabitStats(habit.id, allHabitsRaw)
    }))
  );

  const summary = $derived(buildStatsSummary(allStats));

  // Window range
  function getWindowRange(p: PeriodOption): { start: Date; end: Date } {
    const days = PERIOD_DAY_RANGES[p] ?? 30;
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  const windowRange = $derived(getWindowRange(period));

  // Period segments
  function formatSegmentLabel(date: Date, p: PeriodOption): string {
    switch (p) {
      case 'week': return formatAppDate(date, { weekday: 'short' });
      case 'month': return formatAppDate(date, { month: 'short', day: 'numeric' });
      case 'quarter': return formatAppDate(date, { month: 'short', day: 'numeric' });
      case 'year': return formatAppDate(date, { month: 'short', day: 'numeric', year: '2-digit' });
      default: return formatAppDate(date, { month: 'short', day: 'numeric' });
    }
  }

  function buildDailySegments(p: PeriodOption, days: number): PeriodSegment[] {
    const segments: PeriodSegment[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let offset = days - 1; offset >= 0; offset--) {
      const start = new Date(today);
      start.setDate(start.getDate() - offset);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      segments.push({ start, end, label: formatSegmentLabel(start, p) });
    }
    return segments;
  }

  function groupSegmentsByMonth(segments: PeriodSegment[]): PeriodSegment[] {
    if (segments.length === 0) return segments;
    const grouped: PeriodSegment[] = [];
    let cursor = 0;
    while (cursor < segments.length) {
      const { start } = segments[cursor];
      const keyMonth = start.getMonth();
      const keyYear = start.getFullYear();
      let endIndex = cursor + 1;
      while (endIndex < segments.length) {
        const next = segments[endIndex].start;
        if (next.getMonth() !== keyMonth || next.getFullYear() !== keyYear) break;
        endIndex += 1;
      }
      const chunk = segments.slice(cursor, endIndex);
      const last = chunk[chunk.length - 1];
      grouped.push({ start, end: last.end, label: formatAppDate(start, { month: 'short', year: 'numeric' }) });
      cursor = endIndex;
    }
    return grouped;
  }

  function groupSegmentsByWeekByMonth(segments: PeriodSegment[]): PeriodSegment[] {
    if (segments.length === 0) return segments;
    const grouped: PeriodSegment[] = [];
    let cursor = 0;
    while (cursor < segments.length) {
      const { start } = segments[cursor];
      const keyMonth = start.getMonth();
      const keyYear = start.getFullYear();
      const monthSegments: PeriodSegment[] = [];
      while (cursor < segments.length) {
        const current = segments[cursor];
        if (current.start.getMonth() !== keyMonth || current.start.getFullYear() !== keyYear) break;
        monthSegments.push(current);
        cursor += 1;
      }
      const monthLabel = formatAppDate(monthSegments[0].start, { month: 'short', year: '2-digit' });
      let weekNumber = 1;
      for (let i = 0; i < monthSegments.length; i += 7) {
        const chunk = monthSegments.slice(i, i + 7);
        const last = chunk[chunk.length - 1];
        grouped.push({ start: chunk[0].start, end: last.end, label: `${monthLabel} · Week ${weekNumber}` });
        weekNumber += 1;
      }
    }
    return grouped;
  }

  function buildPeriodSegments(p: PeriodOption, days: number): PeriodSegment[] {
    const dailySegments = buildDailySegments(p, days);
    if (p === 'quarter') return groupSegmentsByWeekByMonth(dailySegments);
    if (p === 'year') return groupSegmentsByMonth(dailySegments);
    return dailySegments;
  }

  const periodSegments = $derived(buildPeriodSegments(period, PERIOD_DAY_RANGES[period] ?? 30));

  function differenceInDays(later: Date, earlier: Date) {
    return Math.round((later.getTime() - earlier.getTime()) / 86400000);
  }

  function getCompletionThreshold(habit: Habit) {
    return Math.max(1, habit.dailyTarget ?? 1);
  }

  // Daily completion data
  const dailyData = $derived.by((): DailyDataPoint[] => {
    const { start, end } = windowRange;
    const habits = visibleHabits;

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

    return periodSegments.map((segment) => {
      const spanDays = Math.max(1, differenceInDays(segment.end, segment.start));
      let completed = 0;
      for (let cursor = new Date(segment.start); cursor < segment.end; cursor.setDate(cursor.getDate() + 1)) {
        const key = toCompletionKey(cursor);
        completed += habits.filter((h) => (h.completions[key] ?? 0) >= getCompletionThreshold(h)).length;
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
  });

  // Habit period data
  const habitPeriodData = $derived.by(() => {
    return periodSegments.map((segment) => {
      const entry: Record<string, string | number> = { period: segment.label };
      const spanDays = Math.max(1, differenceInDays(segment.end, segment.start));
      visibleHabits.forEach((habit) => {
        let completed = 0;
        for (let cursor = new Date(segment.start); cursor < segment.end; cursor.setDate(cursor.getDate() + 1)) {
          const key = toCompletionKey(cursor);
          if ((habit.completions[key] ?? 0) >= getCompletionThreshold(habit)) completed++;
        }
        entry[habit.name] = Math.round((completed / spanDays) * 100);
      });
      return entry;
    });
  });

  // Weekday stats
  const weekdayStats = $derived.by((): WeekdayStats => {
    const { start, end } = windowRange;
    const habits = visibleHabits;
    const counts = Array(7).fill(0);
    const activeDays = new Set<string>();
    const spanDays = differenceInDays(end, start) + 1;
    for (let offset = 0; offset < spanDays; offset++) {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      const key = toCompletionKey(date);
      const isCompleted = habits.some((h) => (h.completions[key] ?? 0) >= getCompletionThreshold(h));
      if (isCompleted) {
        counts[date.getDay()] += 1;
        activeDays.add(key);
      }
    }
    let bestIndex = 0;
    let worstIndex = -1;
    for (let i = 0; i < 7; i++) {
      if (counts[i] > counts[bestIndex]) bestIndex = i;
      if (counts[i] > 0 && (worstIndex === -1 || counts[i] < counts[worstIndex])) worstIndex = i;
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
  });

  // Frozen dates
  const frozenDates = $derived(new Set(filteredHabits.flatMap((h) => h.freezeDays ?? [])));

  // Activity weeks
  const activityWeeks = $derived.by((): ActivityWeek[] => {
    const { start: rangeStart, end: rangeEnd } = windowRange;
    const habits = visibleHabits;
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
        const intensity = inWindow ? habits.filter((h) => (h.completions[key] ?? 0) >= getCompletionThreshold(h)).length : 0;
        columnDays.push({ date: key, intensity, isFrozen: inWindow && frozenDates.has(key), inWindow });
      }
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + col * 7);
      weeks.push({ label: formatAppDate(weekStart, { month: 'short', day: 'numeric' }), days: columnDays });
    }
    return weeks;
  });

  // Daily habit details (for activity tab heatmap)
  const dailyHabitDetails = $derived.by((): Record<string, string[]> => {
    const details: Record<string, string[]> = {};
    const { start, end } = windowRange;
    const spanDays = differenceInDays(end, start) + 1;
    for (let offset = 0; offset < spanDays; offset++) {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      const key = toCompletionKey(date);
      const names = filteredHabits
        .filter((h) => (h.completions[key] ?? 0) >= getCompletionThreshold(h))
        .map((h) => formatHabitLabel(h));
      if (names.length > 0) details[key] = names;
    }
    return details;
  });

  // Insights
  const insights = $derived(buildStatsInsights(allStats, weekdayStats, habitPeriodData, filteredHabits, period));

  // Sorted stats for Habits tab
  const sortedStats = $derived.by(() => {
    const entries = [...summary.sorted];
    if (habitSort === 'name') {
      entries.sort((a, b) => habitSortDir === 'asc' ? a.habit.name.localeCompare(b.habit.name) : b.habit.name.localeCompare(a.habit.name));
    } else {
      const metric = habitSort === 'rate' ? 'completionRate' : 'longestStreak';
      entries.sort((a, b) => habitSortDir === 'asc' ? a.stats[metric] - b.stats[metric] : b.stats[metric] - a.stats[metric]);
    }
    return entries;
  });

  // Merged completions for activity heatmap
  const mergedCompletions = $derived(filteredHabits.reduce<Record<string, number>>((merged, habit) => {
    for (const [date, count] of Object.entries(habit.completions)) {
      merged[date] = (merged[date] ?? 0) + count;
    }
    return merged;
  }, {}));
  const aggregateTarget = $derived(Math.max(1, filteredHabits.reduce((sum, habit) => sum + Math.max(1, habit.dailyTarget ?? 1), 0)));

  // Chart insight
  const dailyChartInsight = $derived(buildDailyChartInsight(summary.avgRate, dailyData));

  // ─── Handlers ───
  function toggleTag(tag: string) {
    selectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
  }

  function toggleHabitVisibility(name: string) {
    hiddenHabits = hiddenHabits.includes(name)
      ? hiddenHabits.filter((n) => n !== name)
      : [...hiddenHabits, name];
  }

  function handleSortChange(key: 'rate' | 'streak' | 'name') {
    if (habitSort === key) {
      habitSortDir = habitSortDir === 'desc' ? 'asc' : 'desc';
    } else {
      habitSort = key;
      habitSortDir = 'desc';
    }
  }

  // Bar chart max for simple bars
  function barHeight(rate: number): string {
    return `${Math.max(2, rate)}%`;
  }
</script>

<div class="min-h-screen bg-bg-primary">
  <!-- Header -->
  <div class="border-b border-border px-4 py-4">
    <div class="max-w-6xl mx-auto">
      <p class="text-[10px] font-mono text-muted uppercase tracking-widest mb-1">Overview</p>
      <h1 class="text-xl font-semibold text-foreground">Statistics</h1>
    </div>
  </div>

  <!-- Tab bar -->
  <div class="sticky top-0 z-30 border-b border-border bg-bg-primary/95 backdrop-blur-sm">
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex items-center gap-2 overflow-hidden">
        <div class="flex min-w-0 flex-1 items-center overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {#each TABS as tab}
            {@const isActive = activeTab === tab.id}
            <button
              onclick={() => (activeTab = tab.id)}
              class="relative shrink-0 px-3 py-3 text-[11px] font-mono transition-colors whitespace-nowrap sm:px-4 sm:text-xs {isActive ? 'text-foreground' : 'text-muted hover:text-foreground/70'}"
            >
              {tab.label}
              {#if isActive}
                <span class="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-accent" style="box-shadow: 0 0 6px var(--glow)"></span>
              {/if}
            </button>
          {/each}
        </div>

        <div class="flex shrink-0 items-center justify-end py-2 pl-1">
          <button
            onclick={() => (filtersOpen = !filtersOpen)}
            aria-label="Toggle filters"
            class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono transition-colors sm:px-3 sm:text-xs {filtersOpen ? 'border-accent text-accent' : 'border-border text-muted hover:text-foreground'}"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
            <span class="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>
    </div>

    {#if filtersOpen}
      <div class="border-t border-border px-4 py-3 max-w-6xl mx-auto">
        <div class="bg-bg-secondary border border-border rounded-lg p-4 space-y-4">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex-1 relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input
                type="text"
                placeholder="Search habits..."
                bind:value={searchQuery}
                class="w-full bg-bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div class="flex bg-bg-card border border-border rounded-lg p-1">
              {#each ['all', 'active', 'archived'] as status}
                <button
                  onclick={() => (statusFilter = status as typeof statusFilter)}
                  class="px-3 py-1 rounded-md text-xs font-mono capitalize transition-colors {statusFilter === status ? 'bg-border text-foreground' : 'text-muted hover:text-foreground'}"
                >
                  {status}
                </button>
              {/each}
            </div>
          </div>
          <div class="flex items-start gap-2">
            <svg class="text-muted mt-1 flex-shrink-0 w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            {#if allTags.length > 0}
              <div class="flex flex-wrap gap-1.5">
                {#each allTags as tag}
                  <button
                    onclick={() => toggleTag(tag)}
                    class="px-2 py-1 rounded border text-[10px] font-mono transition-colors {selectedTags.includes(tag) ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-bg-card border-border text-muted hover:border-border-hover hover:text-foreground'}"
                  >
                    #{tag}
                  </button>
                {/each}
              </div>
            {:else}
              <span class="text-[11px] font-mono text-muted">No tags yet</span>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Tab content -->
  <div class="max-w-6xl mx-auto px-4 py-4">

    <!-- ═══ Overview tab ═══ -->
    {#if activeTab === 'overview'}
      <div class="space-y-4">
        <div class="grid gap-4 md:grid-cols-[2fr,1fr]">
          <!-- Overview signals grid -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <h2 class="text-xs font-mono text-muted uppercase tracking-wider">Overview signals</h2>
              <ChartGuideTooltip {...OVERVIEW_SIGNALS_TOOLTIP} />
            </div>
            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div class="bg-bg-secondary border border-border rounded-lg p-3">
                <div class="flex items-center gap-1 mb-2">
                  <svg class="w-2.5 h-2.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Avg Rate</span>
                </div>
                <div class="text-2xl font-mono font-bold text-accent" style="text-shadow: 0 0 12px var(--glow)">{summary.avgRate}%</div>
              </div>
              <div class="bg-bg-secondary border border-border rounded-lg p-3">
                <div class="flex items-center gap-1 mb-2">
                  <svg class="w-2.5 h-2.5 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>
                  <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Best</span>
                </div>
                <div class="text-2xl font-mono font-bold text-accent-secondary">{summary.bestStreak}d</div>
              </div>
              <div class="bg-bg-secondary border border-border rounded-lg p-3">
                <div class="flex items-center gap-1 mb-2">
                  <svg class="w-2.5 h-2.5 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                  <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Total</span>
                </div>
                <div class="text-2xl font-mono font-bold text-accent-secondary" style="text-shadow: 0 0 12px var(--glow-secondary)">{summary.totalCompletions}</div>
              </div>
              <div class="bg-bg-secondary border border-border rounded-lg p-3">
                <div class="flex items-center gap-1 mb-2">
                  <svg class="w-2.5 h-2.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Active</span>
                </div>
                <div class="text-2xl font-mono font-bold text-foreground">{summary.currentStreaks}</div>
              </div>
            </div>
          </div>

          <!-- Investment section -->
          <div class="bg-bg-secondary border border-border rounded-lg p-4 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-xs font-mono text-muted uppercase tracking-wider">Your Investment</h2>
                  <ChartGuideTooltip {...YOUR_INVESTMENT_TOOLTIP} />
                </div>
                <p class="text-[10px] text-muted mt-1 italic">Progress across habits this window</p>
              </div>
              <div class="text-2xl font-mono font-bold text-accent">{weekdayStats.investmentPercent}%</div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="p-2 bg-bg-card border border-border rounded-lg text-center">
                <p class="text-[8px] font-mono text-muted uppercase">Best Day</p>
                <p class="text-xs font-mono font-bold {weekdayStats.bestWeekday !== 'N/A' ? 'text-accent-secondary' : 'text-muted'}">{weekdayStats.bestWeekday !== 'N/A' ? weekdayStats.bestWeekday : '—'}</p>
              </div>
              <div class="p-2 bg-bg-card border border-border rounded-lg text-center">
                <p class="text-[8px] font-mono text-muted uppercase">Worst Day</p>
                <p class="text-xs font-mono font-bold {weekdayStats.worstWeekday !== 'N/A' ? 'text-muted' : 'text-muted/70'}">{weekdayStats.worstWeekday !== 'N/A' ? weekdayStats.worstWeekday : '—'}</p>
              </div>
              <div class="p-2 bg-bg-card border border-border rounded-lg text-center">
                <p class="text-[8px] font-mono text-muted uppercase">Active Days</p>
                <p class="text-xs font-mono font-bold text-foreground">{weekdayStats.totalActiveDays}d</p>
              </div>
            </div>
            <div class="h-1.5 bg-border rounded-full overflow-hidden">
              <div class="h-full bg-accent transition-all duration-1000" style="width: {weekdayStats.investmentPercent}%; box-shadow: 0 0 10px var(--glow)"></div>
            </div>
            <p class="text-[10px] font-mono text-center" style="color: {getInvestmentColor(weekdayStats.investmentPercent)}">{getInvestmentMessage(weekdayStats.investmentPercent, weekdayStats.worstWeekday)}</p>
          </div>
        </div>

        <!-- Insights -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <h2 class="text-xs font-mono text-muted uppercase tracking-wider">Insights</h2>
            <ChartGuideTooltip {...INSIGHTS_TOOLTIP} />
          </div>
          <div class="grid gap-4 md:grid-cols-3">
            {#each insights as insight}
              <div class="bg-bg-secondary border border-border rounded-lg p-4 space-y-2">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 2v1m0 18v1m-9-10H2m20 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l.707.707M6.343 6.343l-.707-.707"/><circle cx="12" cy="12" r="4"/></svg>
                  <p class="text-[10px] font-mono text-muted uppercase tracking-[0.2em]">{insight.title}</p>
                </div>
                <p class="text-sm text-foreground">{insight.body}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>

    <!-- ═══ Charts tab ═══ -->
    {:else if activeTab === 'charts'}
      <div class="space-y-4">
        <!-- Period selector -->
        <div class="flex justify-end">
          <div class="flex items-center gap-1 rounded-full border border-border bg-bg-card px-1 py-1">
            {#each PERIOD_OPTIONS as option}
              <button
                onclick={() => (period = option.id)}
                class="w-9 h-9 rounded-full text-xs font-mono transition-colors {period === option.id ? 'bg-foreground text-bg-primary' : 'text-muted hover:text-foreground'}"
              >
                {option.label}
              </button>
            {/each}
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <!-- Daily rate chart -->
          <div class="bg-bg-secondary border border-border rounded-lg p-4">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <h2 class="text-xs font-mono text-muted uppercase tracking-wider">Daily completion rate</h2>
                <ChartGuideTooltip title="Daily completion rate" summary="How consistently you finished scheduled habits each day." focusPoints={['Average rate: your baseline.', 'Low bars: missed days.', 'Clusters of strong days: patterns worth repeating.']} variant="bars" />
              </div>
              <span class="text-[10px] font-mono text-accent">{summary.avgRate}% avg</span>
            </div>
            <p class="text-[10px] font-mono text-muted mb-3">Tap bars to see daily details</p>
            <div class="flex items-end gap-[2px] h-[150px] w-full">
              {#each dailyData as point}
                <div class="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
                  <div
                    class="w-full rounded-t bg-accent transition-all duration-300"
                    style="height: {barHeight(point.rate)}; box-shadow: 0 0 6px var(--glow); min-height: 2px;"
                    title="{point.day}: {point.rate}%"
                  ></div>
                  {#if dailyData.length <= 14}
                    <span class="text-[7px] font-mono text-muted truncate w-full text-center">{point.axisLabel}</span>
                  {/if}
                </div>
              {/each}
            </div>
            <div class="flex items-center gap-1 mt-3" style="color: {dailyChartInsight.color}">
              <svg class="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p class="text-[10px] font-mono">{dailyChartInsight.text}</p>
            </div>
          </div>

          <!-- Period trend chart -->
          <div class="bg-bg-secondary border border-border rounded-lg p-4 space-y-4">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-xs font-mono text-muted uppercase tracking-wider">Period trends</h2>
                  <ChartGuideTooltip title="Period trends" summary="Each line tracks per-habit performance over time." focusPoints={['Rising lines: stabilizing.', 'Line crossings: rank changes.', 'Flat low lines: may need simplification.']} variant="line" />
                </div>
                <p class="text-[10px] font-mono text-muted">Tap to hide/show habits</p>
              </div>
              <div class="flex flex-wrap gap-2 max-w-full">
                {#each filteredHabits as habit}
                  <button
                    onclick={() => toggleHabitVisibility(habit.name)}
                    class="rounded-full px-3 py-1 text-[10px] font-mono border transition-colors {hiddenHabits.includes(habit.name) ? 'border-border text-muted bg-bg-card' : 'border-accent/40 bg-accent/10 text-accent'}"
                  >
                    {formatHabitLabel(habit)}
                  </button>
                {/each}
              </div>
            </div>
            <!-- Simplified multi-habit trend bars -->
            {#if habitPeriodData.length > 0 && visibleHabits.length > 0}
              <div class="space-y-3">
                {#each visibleHabits as habit}
                  {@const color = HABIT_COLOR_THEMES[habit.color].hex}
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm">{habit.icon}</span>
                      <span class="text-[10px] font-mono text-muted truncate">{habit.name}</span>
                    </div>
                    <div class="flex items-end gap-[2px] h-10">
                      {#each habitPeriodData as entry}
                        {@const val = Number(entry[habit.name] ?? 0)}
                        <div
                          class="flex-1 rounded-t transition-all duration-300"
                          style="height: {Math.max(2, val)}%; background-color: {color}; box-shadow: 0 0 4px {color}55; min-height: 2px;"
                          title="{entry.period}: {val}%"
                        ></div>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-[11px] font-mono text-muted text-center py-8">No data for this period yet.</p>
            {/if}
          </div>
        </div>
      </div>

    <!-- ═══ Habits tab ═══ -->
    {:else if activeTab === 'habits'}
      <div class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex min-w-0 items-center gap-2">
            <h2 class="text-xs font-mono text-muted uppercase tracking-wider">Habit performance</h2>
            <ChartGuideTooltip title="Habit performance" summary="Compare habits by outcome." focusPoints={['Completion rate: reliability signal.', 'Current streak: live momentum.', 'Status labels: quick flags.']} variant="columns" />
          </div>
          <!-- Sort controls -->
          <div class="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <span class="text-muted">Sort by</span>
            {#each ['rate', 'streak', 'name'] as key}
              <button
                onclick={() => handleSortChange(key as 'rate' | 'streak' | 'name')}
                class="rounded-full px-3 py-1 text-[10px] transition-colors {habitSort === key ? 'bg-border text-foreground' : 'text-muted hover:text-foreground'}"
              >
                {key}
              </button>
            {/each}
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-[2fr,1fr]">
          <!-- Performance list -->
          <div class="bg-bg-secondary border border-border rounded-lg p-4 space-y-2">
            {#each sortedStats as entry, i}
              {@const color = HABIT_COLOR_THEMES[entry.habit.color].hex}
              {@const status = habitStatusLabel(entry.stats.completionRate, entry.stats.currentStreak, entry.stats.longestStreak)}
              <button
                onclick={() => goto(`/habit/${entry.habit.id}`)}
                class="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-bg-card transition-colors text-left"
              >
                <span class="text-[10px] font-mono text-muted w-4">{i + 1}</span>
                <span class="text-base">{entry.habit.icon}</span>
                <div class="flex-1 min-w-0 space-y-1">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-medium text-foreground truncate">{entry.habit.name}</span>
                    <div class="flex items-center gap-2 flex-shrink-0">
                      <span class="text-[9px] font-mono" style="color: {status.color}">{status.label}</span>
                      <span class="text-[10px] font-mono" style="color: {color}">{entry.stats.completionRate}%</span>
                    </div>
                  </div>
                  <div class="h-1 bg-border rounded-full overflow-hidden">
                    <div class="h-full rounded-full" style="width: {entry.stats.completionRate}%; background-color: {color}; box-shadow: 0 0 6px {color}60"></div>
                  </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <svg class="w-3 h-3 text-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>
                  <span class="text-[10px] font-mono text-accent-secondary">{entry.stats.currentStreak}</span>
                  <CompletionRing percentage={entry.stats.completionRate} size={28} strokeWidth={2} color={entry.habit.color} />
                </div>
              </button>
            {/each}
            {#if sortedStats.length === 0}
              <p class="text-sm font-mono text-muted text-center py-8">No habits match the current filters.</p>
            {/if}
          </div>

          <!-- Weekly breakdown -->
          <div class="min-w-0 bg-bg-secondary border border-border rounded-lg p-4">
            <div class="mb-3 flex min-w-0 items-center gap-2">
              <h2 class="min-w-0 text-xs font-mono text-muted uppercase tracking-wider">Weekly breakdown</h2>
              <ChartGuideTooltip title="Weekly breakdown" summary="Recent weekly volume for every habit." focusPoints={['Bar height: days completed that week.', 'Latest bars: strengthening or cooling.', 'Right-side percent: overall rate.']} variant="columns" />
            </div>
            <div class="space-y-3">
              {#each allStats as entry}
                {@const color = HABIT_COLOR_THEMES[entry.habit.color].hex}
                <div class="flex min-w-0 items-center gap-2 sm:gap-3">
                  <span class="w-5 flex-none text-sm">{entry.habit.icon}</span>
                  <span class="min-w-0 w-16 sm:w-20 truncate text-[11px] font-mono text-muted">{entry.habit.name}</span>
                  <div class="flex h-6 min-w-0 flex-1 items-center gap-1">
                    {#each entry.stats.weeklyData as week, idx}
                      <div
                        class="flex-1 rounded-sm"
                        style="height: {(week.count / 7) * 100}%; min-height: 2px; background-color: {color}; opacity: {0.3 + (idx / 12) * 0.7}"
                      ></div>
                    {/each}
                  </div>
                  <span class="w-8 flex-none text-right text-[10px] font-mono" style="color: {color}">{entry.stats.completionRate}%</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>

    <!-- ═══ Activity tab ═══ -->
    {:else if activeTab === 'activity'}
      <div class="bg-bg-secondary border border-border rounded-lg p-3 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h2 class="text-xs font-mono text-muted uppercase tracking-wider">Activity — 90 days</h2>
            <ChartGuideTooltip title="Activity heatmap" summary="90 days of execution in one grid." focusPoints={['Brighter cells: heavier volume.', 'Repeated empty columns: missed stretches.', 'Dense recent activity: durable routine.']} variant="grid" />
          </div>
          <span class="text-[10px] font-mono text-muted">{filteredHabits.length} habits</span>
        </div>
        <HabitHeatmap
          completions={mergedCompletions}
          dailyTarget={aggregateTarget}
          dayDetails={dailyHabitDetails}
        />
      </div>
    {/if}
  </div>
</div>
