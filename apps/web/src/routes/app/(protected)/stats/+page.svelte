<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Plus } from 'lucide-svelte';
  import { habitsStore } from '$lib/stores/habits';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import {
    PERIOD_DISPLAY_NAMES,
    STREAK_MESSAGES,
    STREAK_THRESHOLDS,
    WEEKDAY_NA
  } from '$lib/constants/stats';
  import { getInvestmentColor, getInvestmentMessage } from '$lib/stats/StatsView.helpers';
  import { habitStatusLabel } from '$lib/stats/statsCharts';
  import {
    buildDayDetails,
    buildMergedCompletions,
    buildPeriodSegments,
    buildWeekdayStats,
    cleanupHiddenHabits,
    filterStatsHabits,
    generateDailyCompletionData,
    generateHabitPeriodData,
    getWindowRange,
    type PeriodOption
  } from '$lib/stats/statsPage';
  import StatsHeader from '$lib/components/stats/StatsHeader.svelte';
  import StatsTabs from '$lib/components/stats/StatsTabs.svelte';
  import StatsFilters from '$lib/components/stats/StatsFilters.svelte';
  import OverviewSignals from '$lib/components/stats/OverviewSignals.svelte';
  import InvestmentPanel from '$lib/components/stats/InvestmentPanel.svelte';
  import InsightsGrid from '$lib/components/stats/InsightsGrid.svelte';
  import ChartPanel from '$lib/components/stats/ChartPanel.svelte';
  import HabitPerformanceList from '$lib/components/stats/HabitPerformanceList.svelte';

  type TabId = 'overview' | 'charts' | 'habits' | 'activity';
  type HabitSort = 'rate' | 'streak' | 'name';

  let activeTab = $state<TabId>('overview');
  let period = $state<PeriodOption>('month');
  let filtersOpen = $state(false);
  let searchQuery = $state('');
  let statusFilter = $state<'all' | 'active' | 'archived'>('all');
  let selectedTags = $state<string[]>([]);
  let habitSort = $state<HabitSort>('rate');
  let habitSortDir = $state<'asc' | 'desc'>('desc');
  let hiddenHabits = $state<string[]>([]);

  const PERIOD_OPTIONS = [
    { id: 'week' as PeriodOption, label: 'W' },
    { id: 'month' as PeriodOption, label: 'M' },
    { id: 'quarter' as PeriodOption, label: 'Q' },
    { id: 'year' as PeriodOption, label: 'Y' }
  ] as const;

  const TABS = [
    { id: 'overview' as TabId, label: 'Overview' },
    { id: 'charts' as TabId, label: 'Charts' },
    { id: 'habits' as TabId, label: 'Habits' },
    { id: 'activity' as TabId, label: 'Activity' }
  ] as const;

  // Window range for the selected period (no Date mutation)
  const windowRange = $derived.by(() => getWindowRange(period));
  const periodSegments = $derived.by(() => buildPeriodSegments(period));

  // All unique tags from all habits
  const allTags = $derived.by(() => {
    const seen: string[] = [];
    $habitsStore.allHabits.forEach((h) =>
      (h.tags ?? []).forEach((t) => { if (!seen.includes(t)) seen.push(t); })
    );
    return seen.sort();
  });

  // Filtered habits
  const filteredHabits = $derived(
    filterStatsHabits($habitsStore.allHabits, statusFilter, searchQuery, selectedTags)
  );
  const visibleHabits = $derived(filteredHabits.filter((habit) => !hiddenHabits.includes(habit.name)));

  $effect(() => {
    const next = cleanupHiddenHabits(hiddenHabits, filteredHabits);
    if (next !== hiddenHabits) {
      hiddenHabits = next;
    }
  });

  // All stats for filtered habits
  const allStats = $derived(
    filteredHabits.map((habit) => ({ habit, stats: habitsStore.getHabitStats(habit.id) }))
  );

  // Summary KPIs
  const avgRate = $derived.by(() => {
    if (allStats.length === 0) return 0;
    return Math.round(allStats.reduce((s, e) => s + e.stats.completionRate, 0) / allStats.length);
  });
  const bestStreak = $derived(allStats.length > 0 ? Math.max(...allStats.map((e) => e.stats.longestStreak)) : 0);
  const totalCompletions = $derived(allStats.reduce((s, e) => s + e.stats.completedDays, 0));
  const currentStreaks = $derived(allStats.filter((e) => e.stats.currentStreak > 0).length);

  // Sorted habits for Habits tab
  const sortedStats = $derived.by(() => {
    const entries = [...allStats];
    if (habitSort === 'name') {
      entries.sort((a, b) =>
        habitSortDir === 'asc'
          ? a.habit.name.localeCompare(b.habit.name)
          : b.habit.name.localeCompare(a.habit.name)
      );
    } else {
      const metric = habitSort === 'rate' ? 'completionRate' : 'longestStreak';
      entries.sort((a, b) =>
        habitSortDir === 'asc' ? a.stats[metric] - b.stats[metric] : b.stats[metric] - a.stats[metric]
      );
    }
    return entries;
  });

  const dailyData = $derived.by(() => (
    generateDailyCompletionData(visibleHabits, windowRange.start, windowRange.end, period, periodSegments)
  ));
  const habitPeriodData = $derived.by(() => generateHabitPeriodData(filteredHabits, periodSegments));

  const weekdayStats = $derived.by(() => buildWeekdayStats(filteredHabits, windowRange.start, windowRange.end));

  // Generated insights (3 cards)
  const insights = $derived.by(() => {
    // Streak insight
    const streakLeader = allStats.length > 0
      ? allStats.reduce((best, next) => next.stats.longestStreak > best.stats.longestStreak ? next : best, allStats[0])
      : null;
    const days = streakLeader?.stats.longestStreak ?? 0;
    let streakIcon = Lightbulb;
    let streakBody: string;
    if (days >= STREAK_THRESHOLDS.AUTOMATISM_MIN) {
      streakIcon = Flame;
      streakBody = STREAK_MESSAGES.AUTOMATISM(formatHabitLabel(streakLeader!.habit), days);
    } else if (days >= STREAK_THRESHOLDS.MOMENTUM_MIN) {
      streakIcon = Dumbbell;
      streakBody = STREAK_MESSAGES.MOMENTUM_ENCOURAGEMENT(days, formatHabitLabel(streakLeader!.habit));
    } else if (days > 0) {
      streakIcon = Sprout;
      streakBody = STREAK_MESSAGES.EARLY_STAGE(days);
    } else {
      streakBody = STREAK_MESSAGES.NO_STREAK;
    }

    // Weekday insight
    const { bestWeekday, worstWeekday, counts } = weekdayStats;
    const bestIdx = WEEKDAY_NAMES.indexOf(bestWeekday as typeof WEEKDAY_NAMES[number]);
    const worstIdx = WEEKDAY_NAMES.indexOf(worstWeekday as typeof WEEKDAY_NAMES[number]);
    const bestCount = bestIdx >= 0 ? (counts[bestIdx] ?? 0) : 0;
    const worstCount = worstIdx >= 0 ? (counts[worstIdx] ?? 0) : 0;
    const weekdayDiff = worstCount === 0 ? bestCount * 100 : Math.round(((bestCount - worstCount) / Math.max(1, worstCount)) * 100);
    const hasWeekdayShift = bestWeekday !== WEEKDAY_NA && worstWeekday !== WEEKDAY_NA;
    let weekdayBody: string;
    if (hasWeekdayShift) {
      weekdayBody = weekdayDiff > 50
        ? `${worstWeekday} is your weakest day — try a shorter goal or reminder that day.`
        : `${weekdayDiff}% more completions on ${bestWeekday} vs ${worstWeekday}.`;
    } else {
      weekdayBody = 'Check back after a few active days to see your weekday patterns.';
    }

    // Momentum insight
    const improvedCount = habitPeriodData.length > 1
      ? filteredHabits.reduce((sum, habit) => {
          const lastEntry = habitPeriodData[habitPeriodData.length - 1];
          const previousEntry = habitPeriodData[habitPeriodData.length - 2];
          const current = Number(lastEntry?.[habit.name] ?? 0);
          const previous = Number(previousEntry?.[habit.name] ?? 0);
          return current > previous ? sum + 1 : sum;
        }, 0)
      : 0;
    const total = filteredHabits.length;

    let momentumBody: string;
    let momentumIcon = Lightbulb;
    if (total === 0) {
      momentumBody = 'No habits to measure yet.';
    } else if (improvedCount === total) {
      momentumIcon = Zap;
      momentumBody = `All ${total} habits improved this ${PERIOD_DISPLAY_NAMES[period]} - excellent momentum!`;
    } else if (improvedCount === 0) {
      momentumIcon = TrendingDown;
      momentumBody = `No habits improved this ${PERIOD_DISPLAY_NAMES[period]}. Focus on one habit to break the trend.`;
    } else {
      momentumIcon = TrendingUp;
      momentumBody = `${improvedCount} of ${total} habits improved. Push the other ${total - improvedCount} forward.`;
    }

    return [
      { id: 'streak', title: 'Best streak', body: streakBody, icon: streakIcon },
      { id: 'weekday', title: 'Weekday shift', body: weekdayBody, icon: weekdayDiff > 50 ? AlertTriangle : Calendar },
      { id: 'momentum', title: 'Momentum', body: momentumBody, icon: momentumIcon }
    ];
  });

  const mergedCompletions = $derived.by(() => buildMergedCompletions(filteredHabits));
  const dayDetails = $derived.by(() => buildDayDetails(filteredHabits));

  const aggregateTarget = $derived(
    Math.max(1, filteredHabits.reduce((s, h) => s + Math.max(1, h.dailyTarget ?? 1), 0))
  );
  const investmentColor = $derived(getInvestmentColor(weekdayStats.investmentPercent));
  const investmentMessage = $derived(getInvestmentMessage(weekdayStats.investmentPercent, weekdayStats.worstWeekday));

  function handleSortChange(key: HabitSort) {
    if (habitSort === key) {
      habitSortDir = habitSortDir === 'desc' ? 'asc' : 'desc';
    } else {
      habitSort = key;
      habitSortDir = 'desc';
    }
  }

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
</script>

<svelte:head>
  <title>Stats - Habit Runner</title>
</svelte:head>

{#if $habitsStore.allHabits.length === 0}
  <div class="px-4 py-12">
    <EmptyState title="No stats yet" description="Add a few habits and complete them for a couple of days to unlock the first activity patterns.">
      {#snippet icon()}
        <Plus size={34} />
      {/snippet}
      {#snippet action()}
        <a
          class="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest text-accent transition hover:border-accent-secondary/50"
          href={resolve('/app/(protected)/habit/new', {})}
        >
          Create your first habit
        </a>
      {/snippet}
    </EmptyState>
  </div>
{:else}
  <div class="min-h-screen bg-transparent">
    <!-- Page header -->
    <div class="px-4 pt-4 sm:px-6">
      <div class="mx-auto max-w-6xl rounded-[1.75rem] border border-border bg-bg-secondary/88 px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl">
        <p class="text-[10px] font-mono uppercase tracking-widest text-muted">Overview</p>
        <h1 class="mt-1 text-xl font-semibold text-foreground">Statistics</h1>
      </div>
    </div>

    <!-- Sticky tab bar -->
    <div class="sticky top-0 z-30 bg-transparent px-4 pb-3 pt-2 sm:px-6">
      <div class="mx-auto max-w-6xl rounded-[1.5rem] border border-border bg-bg-secondary/88 px-4 shadow-[0_22px_56px_rgba(15,23,42,0.1)] backdrop-blur-xl">
        <div class="flex flex-wrap items-center gap-2 overflow-hidden py-1 sm:flex-nowrap">
          <!-- Tabs -->
          <div class="flex min-w-0 flex-1 items-center overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <StatsTabs tabs={TABS} activeTab={activeTab} onTabChange={(tab) => activeTab = tab} />
          </div>
          <!-- Filters toggle -->
          <div class="flex shrink-0 items-center justify-end py-2 pl-1">
            <StatsFilters
              searchQuery={searchQuery}
              onSearchChange={(q) => searchQuery = q}
              statusFilter={statusFilter}
              onStatusFilterChange={(f) => statusFilter = f}
              selectedTags={selectedTags}
              allTags={allTags}
              onToggleTag={toggleTag}
              filtersOpen={filtersOpen}
              onToggleFilters={() => filtersOpen = !filtersOpen}
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Tab content -->
    <div class="mx-auto max-w-6xl px-4 py-4 sm:px-6">

      <!-- TAB: OVERVIEW -->
      {#if activeTab === 'overview'}
        <div class="space-y-4">
          <StatsHeader
            habits={filteredHabits}
            period={period}
            onPeriodChange={(p) => period = p}
            periodOptions={PERIOD_OPTIONS}
            periodDisplayNames={PERIOD_DISPLAY_NAMES}
          />
          <div class="grid gap-4 md:grid-cols-[2fr,1fr]">
            <OverviewSignals habits={filteredHabits} period={period} />
            <InvestmentPanel
              weekdayStats={weekdayStats}
              period={period}
              periodDisplayNames={PERIOD_DISPLAY_NAMES}
            />
          </div>
          <InsightsGrid insights={insights} />
        </div>

      <!-- TAB: CHARTS -->
      {:else if activeTab === 'charts'}
        <div class="space-y-4">
          <ChartPanel
            habits={filteredHabits}
            period={period}
            dailyData={dailyData}
            habitPeriodData={habitPeriodData}
            mergedCompletions={mergedCompletions}
            dayDetails={dayDetails}
            aggregateTarget={aggregateTarget}
          />
        </div>

      <!-- TAB: HABITS -->
      {:else if activeTab === 'habits'}
        <div class="space-y-4">
          <HabitPerformanceList
            entries={sortedStats}
            sortDir={habitSortDir}
            onSortChange={handleSortChange}
            hiddenHabits={hiddenHabits}
            onToggleVisibility={toggleHabitVisibility}
          />
        </div>

      <!-- TAB: ACTIVITY -->
      {:else if activeTab === 'activity'}
        <div class="rounded-[1.5rem] border border-border bg-bg-card/92 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <h2 class="min-w-0 text-xs font-mono uppercase tracking-widest text-muted">Activity — 90 days</h2>
            </div>
            <span class="text-[10px] font-mono text-muted">{filteredHabits.length} habits</span>
          </div>
          <HabitHeatmap
            habits={filteredHabits}
            {habitPeriodData}
            period={period}
          />
        </div>
      {/if}
    </div>
  </div>
{/if}
