<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import {
    AlertTriangle,
    Calendar,
    Dumbbell,
    Filter,
    Flame,
    Lightbulb,
    Plus,
    Search,
    Sprout,
    Tag,
    TrendingDown,
    TrendingUp,
    Zap
  } from 'lucide-svelte';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import HabitHeatmap from '$lib/components/HabitHeatmap.svelte';
  import StatsDailyRateChart from '$lib/components/StatsDailyRateChart.svelte';
  import StatsTrendChart from '$lib/components/StatsTrendChart.svelte';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import { habitsStore } from '$lib/stores/habits';
  import {
    INSIGHTS_TOOLTIP,
    OVERVIEW_SIGNALS_TOOLTIP,
    YOUR_INVESTMENT_TOOLTIP
  } from '$lib/habits/blockGuideTooltips';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
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

  const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

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
      momentumBody = `All ${total} habits improving this ${PERIOD_DISPLAY_NAMES[period]} - excellent momentum!`;
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
  <title>Stats - Habbit Runner</title>
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
          href={resolve<'/app/(protected)/habit/new'>('/app/(protected)/habit/new', {})}
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
            {#each TABS as tab, ti (tab.id + '-' + ti)}
              <button
                type="button"
                onclick={() => { activeTab = tab.id; }}
                class="relative flex min-h-11 shrink-0 items-center whitespace-nowrap px-3 py-3 text-[11px] font-mono transition-colors sm:px-4 sm:text-xs {activeTab === tab.id ? 'text-foreground' : 'text-muted hover:text-foreground/70'}"
              >
                {tab.label}
                {#if activeTab === tab.id}
                  <span class="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-accent" style:box-shadow="0 0 6px var(--glow)"></span>
                {/if}
              </button>
            {/each}
          </div>
          <!-- Filters toggle -->
          <div class="flex shrink-0 items-center justify-end py-2 pl-1">
            <button
              type="button"
              onclick={() => { filtersOpen = !filtersOpen; }}
              aria-label="Toggle filters"
              class="flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-mono transition-colors {filtersOpen ? 'border-accent text-accent' : 'border-border text-muted hover:text-foreground'}"
            >
              <Filter size={12} />
              <span class="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Filter panel -->
      {#if filtersOpen}
        <div class="border-t border-border px-0 py-3">
          <div class="mx-auto max-w-6xl">
            <div class="rounded-[1.5rem] border border-border bg-bg-card/92 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] space-y-4">
              <div class="flex flex-col gap-3 sm:flex-row">
                <div class="relative flex-1">
                  <Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Search habits..."
                    bind:value={searchQuery}
                    class="w-full rounded-lg border border-border bg-bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none"
                  />
                </div>
                <div class="flex rounded-lg border border-border bg-bg-card p-1">
                  {#each (['all', 'active', 'archived'] as const) as s, si (s + '-' + si)}
                    <button
                      type="button"
                      onclick={() => { statusFilter = s; }}
                      class="rounded-md px-3 py-2 text-xs font-mono capitalize transition-colors {statusFilter === s ? 'bg-border text-foreground' : 'text-muted hover:text-foreground'}"
                    >
                      {s}
                    </button>
                  {/each}
                </div>
              </div>

              <div class="flex items-start gap-2">
                <Tag size={14} class="mt-1 shrink-0 text-muted" />
                {#if allTags.length > 0}
                  <div class="flex flex-wrap gap-1.5">
                    {#each allTags as tag, ti (tag + '-' + ti)}
                      <button
                        type="button"
                        onclick={() => toggleTag(tag)}
                        class="rounded border px-2 py-1 text-[10px] font-mono transition-colors {selectedTags.includes(tag) ? 'border-accent/30 bg-accent/10 text-accent' : 'border-border bg-bg-card text-muted hover:text-foreground'}"
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
        </div>
      {/if}
    </div>

    <!-- Tab content -->
    <div class="mx-auto max-w-6xl px-4 py-4 sm:px-6">

      <!-- ── TAB: OVERVIEW ──────────────────────────────────────── -->
      {#if activeTab === 'overview'}
        <div class="space-y-4">
          <!-- KPI grid + Investment -->
          <div class="grid gap-4 md:grid-cols-[2fr,1fr]">
            <!-- Overview signals -->
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Overview signals</h2>
                <ChartGuideTooltip {...OVERVIEW_SIGNALS_TOOLTIP} triggerClassName="h-7 w-7" />
              </div>
              <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div class="rounded-[1.35rem] border border-border bg-bg-card/92 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
                  <div class="mb-2 flex items-center gap-1">
                    <Zap size={10} class="text-accent" />
                    <span class="text-[9px] font-mono uppercase tracking-wider text-muted">Avg Rate</span>
                  </div>
                  <div class="text-2xl font-mono font-bold text-accent" style:text-shadow="0 0 12px var(--glow)">{avgRate}%</div>
                </div>
                <div class="rounded-[1.35rem] border border-border bg-bg-card/92 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
                  <div class="mb-2 flex items-center gap-1">
                    <Flame size={10} class="text-accent-secondary" />
                    <span class="text-[9px] font-mono uppercase tracking-wider text-muted">Best</span>
                  </div>
                  <div class="text-2xl font-mono font-bold text-accent-secondary">{bestStreak}d</div>
                </div>
                <div class="rounded-[1.35rem] border border-border bg-bg-card/92 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
                  <div class="mb-2 flex items-center gap-1">
                    <TrendingUp size={10} class="text-accent-secondary" />
                    <span class="text-[9px] font-mono uppercase tracking-wider text-muted">Total</span>
                  </div>
                  <div class="text-2xl font-mono font-bold text-accent-secondary" style:text-shadow="0 0 12px var(--glow-secondary)">{totalCompletions}</div>
                </div>
                <div class="rounded-[1.35rem] border border-border bg-bg-card/92 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
                  <div class="mb-2 flex items-center gap-1">
                    <Calendar size={10} class="text-muted" />
                    <span class="text-[9px] font-mono uppercase tracking-wider text-muted">Active</span>
                  </div>
                  <div class="text-2xl font-mono font-bold text-foreground">{currentStreaks}</div>
                </div>
              </div>
            </div>

            <!-- Investment section -->
            <div class="rounded-[1.5rem] border border-border bg-bg-card/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Your Investment</h2>
                    <ChartGuideTooltip {...YOUR_INVESTMENT_TOOLTIP} triggerClassName="h-7 w-7" />
                  </div>
                  <p class="mt-1 text-[10px] italic text-muted">Progress across habits this window</p>
                </div>
                <div class="text-2xl font-mono font-bold text-accent">{weekdayStats.investmentPercent}%</div>
              </div>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div class="rounded-[1rem] border border-border bg-bg-secondary/88 p-2.5 text-center">
                  <p class="text-[8px] font-mono uppercase text-muted">Best Day</p>
                  <p class="text-xs font-mono font-bold {weekdayStats.bestWeekday !== WEEKDAY_NA ? 'text-accent-secondary' : 'text-muted'}">{weekdayStats.bestWeekday !== WEEKDAY_NA ? weekdayStats.bestWeekday : '—'}</p>
                </div>
                <div class="rounded-[1rem] border border-border bg-bg-secondary/88 p-2.5 text-center">
                  <p class="text-[8px] font-mono uppercase text-muted">Worst Day</p>
                  <p class="text-xs font-mono font-bold {weekdayStats.worstWeekday !== WEEKDAY_NA ? 'text-muted' : 'text-muted/70'}">{weekdayStats.worstWeekday !== WEEKDAY_NA ? weekdayStats.worstWeekday : '—'}</p>
                </div>
                <div class="rounded-[1rem] border border-border bg-bg-secondary/88 p-2.5 text-center">
                  <p class="text-[8px] font-mono uppercase text-muted">Active Days</p>
                  <p class="text-xs font-mono font-bold text-foreground">{weekdayStats.totalActiveDays}d</p>
                </div>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-border">
                <div class="h-full bg-accent transition-all duration-1000" style:width="{weekdayStats.investmentPercent}%" style:box-shadow="0 0 10px var(--glow)"></div>
              </div>
              <p class="text-[10px] font-mono text-center" style:color={investmentColor}>{investmentMessage}</p>
            </div>
          </div>

          <!-- Insights row -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Insights</h2>
              <ChartGuideTooltip {...INSIGHTS_TOOLTIP} triggerClassName="h-7 w-7" />
            </div>
            <div class="grid gap-4 md:grid-cols-3">
              {#each insights as insight (insight.id)}
                <div class="rounded-[1.5rem] border border-border bg-bg-card/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] space-y-2">
                  <div class="flex items-center gap-2">
                    <insight.icon size={16} class="shrink-0 text-accent" />
                    <p class="text-[10px] font-mono uppercase tracking-[0.2em] text-muted">{insight.title}</p>
                  </div>
                  <p class="text-sm text-foreground">{insight.body}</p>
                </div>
              {/each}
            </div>
          </div>
        </div>

      <!-- ── TAB: CHARTS ─────────────────────────────────────────── -->
      {:else if activeTab === 'charts'}
        <div class="space-y-4">
          <!-- Period selector -->
          <div class="flex justify-end">
            <div class="flex items-center gap-1 rounded-full border border-border bg-bg-card px-1 py-1">
              {#each PERIOD_OPTIONS as opt, pIdx (opt.id + '-' + pIdx)}
                <button
                  type="button"
                  onclick={() => { period = opt.id; }}
                  class="h-10 w-10 rounded-full text-xs font-mono transition-colors {period === opt.id ? 'bg-foreground text-bg-primary' : 'text-muted hover:text-foreground'}"
                >
                  {opt.label}
                </button>
              {/each}
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <StatsDailyRateChart {avgRate} {dailyData} {period} />
            <StatsTrendChart
              {habitPeriodData}
              {filteredHabits}
              {hiddenHabits}
              {toggleHabitVisibility}
              {period}
            />
          </div>

          <!-- Weekday breakdown -->
          <div class="rounded-[1.5rem] border border-border bg-bg-card/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div class="mb-4 flex min-w-0 items-center gap-2">
              <h2 class="min-w-0 text-xs font-mono uppercase tracking-wider text-muted">Weekday breakdown</h2>
              <ChartGuideTooltip
                title="Weekly breakdown"
                summary="This compact view compares recent weekly volume for every habit so you can see which ones stay active and which ones fade out."
                focusPoints={[
                  'Bar height: how many days the habit was completed that week.',
                  'Latest bars: whether the habit is strengthening or cooling off now.',
                  'Right-side percent: overall completion rate for quick ranking.'
                ]}
                variant="columns"
              />
            </div>
            <div class="flex gap-2">
              {#each WEEKDAY_NAMES as day, di (day + '-' + di)}
                {@const count = weekdayStats.counts[di] ?? 0}
                {@const maxCount = Math.max(1, ...weekdayStats.counts)}
                {@const isActive = count > 0}
                <div class="flex flex-1 flex-col items-center gap-2">
                  <div class="relative h-20 w-full overflow-hidden rounded-sm bg-border">
                    <div
                      class="absolute bottom-0 w-full rounded-sm bg-accent transition-all duration-500"
                      style:height="{(count / maxCount) * 100}%"
                      style:box-shadow="0 0 6px var(--glow)"
                    ></div>
                  </div>
                  <span class="text-[9px] font-mono {isActive ? 'text-foreground' : 'text-muted'}">{day}</span>
                  <span class="text-[8px] font-mono text-muted">{count}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>

      <!-- ── TAB: HABITS ─────────────────────────────────────────── -->
      {:else if activeTab === 'habits'}
        <div class="space-y-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex min-w-0 items-center gap-2">
              <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Habit performance</h2>
              <ChartGuideTooltip
                title="Habit performance"
                summary="This ranking helps you compare habits by outcome, so you can see which routines are solid and which ones need intervention first."
                focusPoints={[
                  'Completion rate: the fastest signal of reliability.',
                  'Current streak: whether the habit still has live momentum.',
                  'Status labels: quick flags for strong, steady, or struggling habits.'
                ]}
                variant="columns"
              />
            </div>
            <!-- Sort controls -->
            <div class="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span class="text-muted">Sort by</span>
              {#each (['rate', 'streak', 'name'] as const) as key, keyIdx (key + '-' + keyIdx)}
                <button
                  type="button"
                  onclick={() => handleSortChange(key)}
                  class="rounded-full px-3 py-1.5 text-[10px] transition-colors {habitSort === key ? 'bg-border text-foreground' : 'text-muted hover:text-foreground'}"
                >
                  {key}
                </button>
              {/each}
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-[2fr,1fr]">
            <!-- Performance list -->
            <div class="rounded-[1.5rem] border border-border bg-bg-card/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] space-y-2">
              {#each sortedStats as entry, i (entry.habit.id)}
                {@const color = HABIT_COLOR_THEMES[entry.habit.color]?.hex ?? 'var(--accent)'}
                {@const status = habitStatusLabel(entry.stats.completionRate, entry.stats.currentStreak, entry.stats.longestStreak)}
                <button
                  type="button"
                  class="w-full flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-bg-card"
                  onclick={() => void goto(resolve('/app/(protected)/habit/[id]', { id: entry.habit.id }))}
                >
                  <span class="w-4 shrink-0 text-[10px] font-mono text-muted">{i + 1}</span>
                  <span class="text-base">{entry.habit.icon}</span>
                  <div class="min-w-0 flex-1 space-y-1">
                    <div class="flex items-center justify-between gap-2">
                      <span class="truncate text-xs font-medium text-foreground">{entry.habit.name}</span>
                      <div class="flex shrink-0 items-center gap-2">
                        <span class="text-[9px] font-mono" style:color={status.color}>{status.label}</span>
                        <span class="text-[10px] font-mono" style:color={color}>{entry.stats.completionRate}%</span>
                      </div>
                    </div>
                    <div class="h-1 overflow-hidden rounded-full bg-border">
                      <div
                        class="h-full rounded-full"
                        style:width="{entry.stats.completionRate}%"
                        style:background-color={color}
                        style:box-shadow="0 0 6px {color}60"
                      ></div>
                    </div>
                  </div>
                  <div class="flex shrink-0 items-center gap-1">
                    <Flame size={12} class="text-accent-secondary" />
                    <span class="text-[10px] font-mono text-accent-secondary">{entry.stats.currentStreak}</span>
                    <CompletionRing percentage={entry.stats.completionRate} size={28} strokeWidth={2} color={entry.habit.color} />
                  </div>
                </button>
              {/each}
              {#if sortedStats.length === 0}
                <p class="py-6 text-center text-xs text-muted">No habits match the current filters.</p>
              {/if}
            </div>

            <!-- Weekly breakdown -->
            <div class="min-w-0 rounded-[1.5rem] border border-border bg-bg-card/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div class="mb-3 flex min-w-0 items-center gap-2">
                <h2 class="min-w-0 text-xs font-mono uppercase tracking-wider text-muted">Weekly breakdown</h2>
                <ChartGuideTooltip
                  title="Weekly breakdown"
                  summary="This compact view compares recent weekly volume for every habit so you can see which ones stay active and which ones fade out."
                  focusPoints={[
                    'Bar height: how many days the habit was completed that week.',
                    'Latest bars: whether the habit is strengthening or cooling off now.',
                    'Right-side percent: overall completion rate for quick ranking.'
                  ]}
                  variant="columns"
                />
              </div>
              <div class="space-y-3">
                {#each allStats as entry (entry.habit.id)}
                  {@const color = HABIT_COLOR_THEMES[entry.habit.color]?.hex ?? 'var(--accent)'}
                  <div class="flex min-w-0 items-center gap-2 sm:gap-3">
                    <span class="w-5 shrink-0 text-sm">{entry.habit.icon}</span>
                    <span class="w-16 min-w-0 shrink-0 truncate text-[11px] font-mono text-muted sm:w-20">{entry.habit.name}</span>
                    <div class="flex h-6 min-w-0 flex-1 items-center gap-[2px]">
                      {#each entry.stats.weeklyData as week, wi (entry.habit.id + '-' + wi)}
                        <div
                          class="flex-1 rounded-sm"
                          style:height="{Math.max(2, (week.count / 7) * 100)}%"
                          style:min-height="2px"
                          style:background-color={color}
                          style:opacity="{0.3 + (wi / 12) * 0.7}"
                        ></div>
                      {/each}
                    </div>
                    <span class="w-8 shrink-0 text-right text-[10px] font-mono" style:color={color}>{entry.stats.completionRate}%</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>

      <!-- ── TAB: ACTIVITY ──────────────────────────────────────── -->
      {:else if activeTab === 'activity'}
        <div class="rounded-[1.5rem] border border-border bg-bg-card/92 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Activity — 90 days</h2>
              <ChartGuideTooltip
                title="Activity heatmap"
                summary="This heatmap compresses 90 days of execution into one grid, so you can see consistency, streak clusters, and dead zones at a glance."
                focusPoints={[
                  'Brighter cells: heavier completion volume on that day.',
                  'Repeated empty columns: missed stretches that break rhythm.',
                  'Dense recent activity: a strong sign your routine is becoming durable.'
                ]}
                variant="grid"
              />
            </div>
            <span class="text-[10px] font-mono text-muted">{filteredHabits.length} habits</span>
          </div>
          <HabitHeatmap
            completions={mergedCompletions}
            dailyTarget={aggregateTarget}
            dayDetails={dayDetails}
          />
        </div>
      {/if}
    </div>
  </div>
{/if}
