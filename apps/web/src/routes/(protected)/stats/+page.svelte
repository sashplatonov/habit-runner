<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Flame, Filter, Search, Tag, Zap, TrendingUp, Calendar, Dumbbell, Sprout, Lightbulb, AlertTriangle, Plus } from 'lucide-svelte';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import HabitHeatmap from '$lib/components/HabitHeatmap.svelte';
  import { toCompletionKey } from '@/lib/completionKey';
  import { formatAppDate } from '@/lib/i18n';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import { habitsStore } from '$lib/stores/habits';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
  import { PERIOD_DAY_RANGES, STREAK_THRESHOLDS, STREAK_MESSAGES, WEEKDAY_NA } from '$lib/constants/stats';
  import type { Habit } from '@/types/habit';

  type PeriodOption = 'week' | 'month' | 'quarter' | 'year';
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

  function differenceInDays(later: Date, earlier: Date): number {
    return Math.round((later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24));
  }

  function getCompletionThreshold(habit: Habit): number {
    return Math.max(1, habit.dailyTarget ?? 1);
  }

  function habitStatusLabel(completionRate: number, currentStreak: number): { label: string; color: string } {
    if (completionRate >= 85 && currentStreak >= 7) return { label: 'Strong', color: 'text-accent' };
    if (completionRate >= 60 || currentStreak >= 3) return { label: 'Steady', color: 'text-accent-secondary' };
    return { label: 'Struggling', color: 'text-muted' };
  }

  // Window range for the selected period (no Date mutation)
  const windowRange = $derived.by(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = PERIOD_DAY_RANGES[period] ?? 30;
    const start = new Date(end.getTime() - (days - 1) * 86_400_000);
    return { start, end };
  });

  // All unique tags from all habits
  const allTags = $derived.by(() => {
    const seen: string[] = [];
    $habitsStore.allHabits.forEach((h) =>
      (h.tags ?? []).forEach((t) => { if (!seen.includes(t)) seen.push(t); })
    );
    return seen.sort();
  });

  // Filtered habits
  const filteredHabits = $derived.by(() => {
    return $habitsStore.allHabits.filter((habit) => {
      if (statusFilter === 'active' && habit.archived) return false;
      if (statusFilter === 'archived' && !habit.archived) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!habit.name.toLowerCase().includes(q) && !(habit.description ?? '').toLowerCase().includes(q)) return false;
      }
      if (selectedTags.length > 0 && !(habit.tags ?? []).some((tag) => selectedTags.includes(tag))) return false;
      return true;
    });
  });

  // All stats for filtered habits
  const allStats = $derived(
    filteredHabits.map((habit) => ({ habit, stats: habitsStore.getHabitStats(habit.id) }))
  );
  const statsByHabitId = $derived(new Map(allStats.map((entry) => [entry.habit.id, entry.stats])));

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

  // Daily completion rate data for bar chart
  const dailyData = $derived.by(() => {
    const { start, end } = windowRange;
    const days = differenceInDays(end, start) + 1;
    const visible = filteredHabits.filter((h) => !hiddenHabits.includes(h.name));
    const total = visible.length;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(start.getTime() + i * 86_400_000);
      const key = toCompletionKey(date);
      const completed = visible.filter((h) => (h.completions[key] ?? 0) >= getCompletionThreshold(h)).length;
      return {
        label: period === 'week'
          ? formatAppDate(date, { weekday: 'short' })
          : formatAppDate(date, { month: 'short', day: 'numeric' }),
        rate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });
  });

  // Weekday stats
  const weekdayStats = $derived.by(() => {
    const { start, end } = windowRange;
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const activeDays: string[] = [];
    const spanDays = differenceInDays(end, start) + 1;
    for (let i = 0; i < spanDays; i++) {
      const date = new Date(start.getTime() + i * 86_400_000);
      const key = toCompletionKey(date);
      const isCompleted = filteredHabits.some((h) => (h.completions[key] ?? 0) >= getCompletionThreshold(h));
      if (isCompleted) {
        counts[date.getDay()] += 1;
        if (!activeDays.includes(key)) activeDays.push(key);
      }
    }
    let bestIndex = 0;
    let worstIndex = -1;
    for (let i = 0; i < 7; i++) {
      if (counts[i] > counts[bestIndex]) bestIndex = i;
      if (counts[i] > 0 && (worstIndex === -1 || counts[i] < counts[worstIndex])) worstIndex = i;
    }
    const totalActiveDays = activeDays.length;
    const investmentPercent = Math.round((totalActiveDays / Math.max(1, spanDays)) * 100);
    return {
      bestWeekday: counts[bestIndex] > 0 ? WEEKDAY_NAMES[bestIndex] : WEEKDAY_NA,
      worstWeekday: worstIndex >= 0 ? WEEKDAY_NAMES[worstIndex] : WEEKDAY_NA,
      counts,
      investmentPercent,
      totalActiveDays,
      spanDays
    };
  });

  // Generated insights (3 cards)
  const insights = $derived.by(() => {
    // Streak insight
    const streakLeader = allStats.length > 0
      ? allStats.reduce((best, next) => next.stats.longestStreak > best.stats.longestStreak ? next : best, allStats[0])
      : null;
    const days = streakLeader?.stats.longestStreak ?? 0;
    let streakBody: string;
    if (days >= STREAK_THRESHOLDS.AUTOMATISM_MIN) {
      streakBody = STREAK_MESSAGES.AUTOMATISM(formatHabitLabel(streakLeader!.habit), days);
    } else if (days >= STREAK_THRESHOLDS.MOMENTUM_MIN) {
      streakBody = STREAK_MESSAGES.MOMENTUM_ENCOURAGEMENT(days, formatHabitLabel(streakLeader!.habit));
    } else if (days > 0) {
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
    let momentumBody: string;
    if (allStats.length === 0) {
      momentumBody = 'Add habits and start completing them to unlock momentum insights.';
    } else if (avgRate >= 80) {
      momentumBody = 'Strong consistency across the board. Keep the rhythm.';
    } else if (avgRate >= 50) {
      momentumBody = 'Good base. Push consistency on your lowest-performing habits.';
    } else {
      momentumBody = 'Low average rate. Pick one core habit to focus on this week.';
    }

    return [
      { id: 'streak', title: 'Best streak', body: streakBody, icon: Flame },
      { id: 'weekday', title: 'Weekday shift', body: weekdayBody, icon: weekdayDiff > 50 ? AlertTriangle : Calendar },
      { id: 'momentum', title: 'Momentum', body: momentumBody, icon: avgRate >= 80 ? Dumbbell : avgRate >= 50 ? Sprout : Lightbulb }
    ];
  });

  // Merged completions for activity tab
  const mergedCompletions = $derived.by(() => {
    const merged: Record<string, number> = {};
    filteredHabits.forEach((h) => {
      Object.entries(h.completions).forEach(([date, count]) => {
        merged[date] = (merged[date] ?? 0) + (count ?? 0);
      });
    });
    return merged;
  });

  const dayDetails = $derived.by(() => {
    const details: Record<string, string[]> = {};
    filteredHabits.forEach((h) => {
      const label = formatHabitLabel(h);
      Object.entries(h.completions).forEach(([date, count]) => {
        if ((count ?? 0) <= 0) return;
        if (!details[date]) details[date] = [];
        details[date].push(label);
      });
    });
    return details;
  });

  const aggregateTarget = $derived(
    Math.max(1, filteredHabits.reduce((s, h) => s + Math.max(1, h.dailyTarget ?? 1), 0))
  );

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
          href={resolve<'/(protected)/habit/new'>('/(protected)/habit/new', {})}
        >
          Create your first habit
        </a>
      {/snippet}
    </EmptyState>
  </div>
{:else}
  <div class="min-h-screen bg-bg-primary">
    <!-- Page header -->
    <div class="border-b border-border px-4 py-4">
      <div class="mx-auto max-w-6xl">
        <p class="text-[10px] font-mono uppercase tracking-widest text-muted">Overview</p>
        <h1 class="mt-1 text-xl font-semibold text-foreground">Statistics</h1>
      </div>
    </div>

    <!-- Sticky tab bar -->
    <div class="sticky top-0 z-30 border-b border-border bg-bg-primary/95 backdrop-blur-sm">
      <div class="mx-auto max-w-6xl px-4">
        <div class="flex items-center gap-2 overflow-hidden">
          <!-- Tabs -->
          <div class="flex min-w-0 flex-1 items-center overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {#each TABS as tab, ti (tab.id + '-' + ti)}
              <button
                type="button"
                onclick={() => { activeTab = tab.id; }}
                class="relative shrink-0 whitespace-nowrap px-3 py-3 text-[11px] font-mono transition-colors sm:px-4 sm:text-xs {activeTab === tab.id ? 'text-foreground' : 'text-muted hover:text-foreground/70'}"
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
              class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono transition-colors sm:px-3 sm:text-xs {filtersOpen ? 'border-accent text-accent' : 'border-border text-muted hover:text-foreground'}"
            >
              <Filter size={12} />
              <span class="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Filter panel -->
      {#if filtersOpen}
        <div class="border-t border-border px-4 py-3">
          <div class="mx-auto max-w-6xl space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row">
              <!-- Search input -->
              <div class="relative flex-1">
                <Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search habits..."
                  bind:value={searchQuery}
                  class="w-full rounded-lg border border-border bg-bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none"
                />
              </div>
              <!-- Status filter -->
              <div class="flex rounded-lg border border-border bg-bg-card p-1">
                {#each (['all', 'active', 'archived'] as const) as s, si (s + '-' + si)}
                  <button
                    type="button"
                    onclick={() => { statusFilter = s; }}
                    class="rounded-md px-3 py-1 text-xs font-mono capitalize transition-colors {statusFilter === s ? 'bg-border text-foreground' : 'text-muted hover:text-foreground'}"
                  >
                    {s}
                  </button>
                {/each}
              </div>
            </div>
            <!-- Tags -->
            {#if allTags.length > 0}
              <div class="flex items-start gap-2">
                <Tag size={14} class="mt-1 shrink-0 text-muted" />
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
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Tab content -->
    <div class="mx-auto max-w-6xl px-4 py-4">

      <!-- ── TAB: OVERVIEW ──────────────────────────────────────── -->
      {#if activeTab === 'overview'}
        <div class="space-y-4">
          <!-- KPI grid + Investment -->
          <div class="grid gap-4 md:grid-cols-[2fr,1fr]">
            <!-- Overview signals -->
            <div class="space-y-2">
              <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Overview signals</h2>
              <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div class="rounded-lg border border-border bg-bg-secondary p-3">
                  <div class="mb-2 flex items-center gap-1">
                    <Zap size={10} class="text-accent" />
                    <span class="text-[9px] font-mono uppercase tracking-wider text-muted">Avg Rate</span>
                  </div>
                  <div class="text-2xl font-mono font-bold text-accent" style:text-shadow="0 0 12px var(--glow)">{avgRate}%</div>
                </div>
                <div class="rounded-lg border border-border bg-bg-secondary p-3">
                  <div class="mb-2 flex items-center gap-1">
                    <Flame size={10} class="text-accent-secondary" />
                    <span class="text-[9px] font-mono uppercase tracking-wider text-muted">Best</span>
                  </div>
                  <div class="text-2xl font-mono font-bold text-accent-secondary">{bestStreak}d</div>
                </div>
                <div class="rounded-lg border border-border bg-bg-secondary p-3">
                  <div class="mb-2 flex items-center gap-1">
                    <TrendingUp size={10} class="text-accent-secondary" />
                    <span class="text-[9px] font-mono uppercase tracking-wider text-muted">Total</span>
                  </div>
                  <div class="text-2xl font-mono font-bold text-accent-secondary" style:text-shadow="0 0 12px var(--glow-secondary)">{totalCompletions}</div>
                </div>
                <div class="rounded-lg border border-border bg-bg-secondary p-3">
                  <div class="mb-2 flex items-center gap-1">
                    <Calendar size={10} class="text-muted" />
                    <span class="text-[9px] font-mono uppercase tracking-wider text-muted">Active</span>
                  </div>
                  <div class="text-2xl font-mono font-bold text-foreground">{currentStreaks}</div>
                </div>
              </div>
            </div>

            <!-- Investment section -->
            <div class="rounded-lg border border-border bg-bg-secondary p-4 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Your Investment</h2>
                  <p class="mt-1 text-[10px] italic text-muted">Progress across habits this window</p>
                </div>
                <div class="text-2xl font-mono font-bold text-accent">{weekdayStats.investmentPercent}%</div>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="rounded-lg border border-border bg-bg-card p-2 text-center">
                  <p class="text-[8px] font-mono uppercase text-muted">Best Day</p>
                  <p class="text-xs font-mono font-bold {weekdayStats.bestWeekday !== WEEKDAY_NA ? 'text-accent-secondary' : 'text-muted'}">{weekdayStats.bestWeekday !== WEEKDAY_NA ? weekdayStats.bestWeekday : '—'}</p>
                </div>
                <div class="rounded-lg border border-border bg-bg-card p-2 text-center">
                  <p class="text-[8px] font-mono uppercase text-muted">Worst Day</p>
                  <p class="text-xs font-mono font-bold {weekdayStats.worstWeekday !== WEEKDAY_NA ? 'text-muted' : 'text-muted/70'}">{weekdayStats.worstWeekday !== WEEKDAY_NA ? weekdayStats.worstWeekday : '—'}</p>
                </div>
                <div class="rounded-lg border border-border bg-bg-card p-2 text-center">
                  <p class="text-[8px] font-mono uppercase text-muted">Active Days</p>
                  <p class="text-xs font-mono font-bold text-foreground">{weekdayStats.totalActiveDays}d</p>
                </div>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-border">
                <div class="h-full bg-accent transition-all duration-1000" style:width="{weekdayStats.investmentPercent}%" style:box-shadow="0 0 10px var(--glow)"></div>
              </div>
            </div>
          </div>

          <!-- Insights row -->
          <div class="space-y-2">
            <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Insights</h2>
            <div class="grid gap-4 md:grid-cols-3">
              {#each insights as insight (insight.id)}
                <div class="rounded-lg border border-border bg-bg-secondary p-4 space-y-2">
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
                  class="h-9 w-9 rounded-full text-xs font-mono transition-colors {period === opt.id ? 'bg-foreground text-bg-primary' : 'text-muted hover:text-foreground'}"
                >
                  {opt.label}
                </button>
              {/each}
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <!-- Daily completion rate (bar chart via HTML/CSS) -->
            <div class="rounded-lg border border-border bg-bg-secondary p-4">
              <div class="mb-3 flex items-center justify-between">
                <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Daily completion rate</h2>
                <span class="text-[10px] font-mono text-accent">{avgRate}% avg</span>
              </div>
              {#if dailyData.length > 0}
                <div class="flex h-[150px] items-end gap-[2px]">
                  {#each dailyData as d, di (d.label + '-' + di)}
                    <div
                      class="group relative flex flex-1 flex-col items-center justify-end"
                      title="{d.label}: {d.rate}%"
                    >
                      <div
                        class="w-full rounded-t-sm bg-accent transition-all duration-300"
                        style:height="{Math.max(2, d.rate * 1.5)}px"
                        style:box-shadow="0 0 4px var(--glow)"
                      ></div>
                    </div>
                  {/each}
                </div>
                <!-- X axis labels (only show every Nth to avoid crowding) -->
                {#if dailyData.length <= 14}
                  <div class="mt-2 flex gap-[2px]">
                    {#each dailyData as d, di (d.label + '-' + di)}
                      <div class="flex-1 truncate text-center text-[8px] font-mono text-muted">{d.label}</div>
                    {/each}
                  </div>
                {:else}
                  <div class="mt-2 flex justify-between">
                    <span class="text-[8px] font-mono text-muted">{dailyData[0]?.label ?? ''}</span>
                    <span class="text-[8px] font-mono text-muted">{dailyData[Math.floor(dailyData.length / 2)]?.label ?? ''}</span>
                    <span class="text-[8px] font-mono text-muted">{dailyData[dailyData.length - 1]?.label ?? ''}</span>
                  </div>
                {/if}
              {:else}
                <p class="py-8 text-center text-xs text-muted">No data for this period</p>
              {/if}
            </div>

            <!-- Period trend per habit (stacked bar view) -->
            <div class="rounded-lg border border-border bg-bg-secondary p-4 space-y-4">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Per-habit performance</h2>
                <div class="flex flex-wrap gap-1.5 max-w-full">
                  {#each filteredHabits as habit (habit.id)}
                    <button
                      type="button"
                      onclick={() => toggleHabitVisibility(habit.name)}
                      class="rounded-full border px-2 py-1 text-[9px] font-mono transition-colors {hiddenHabits.includes(habit.name) ? 'border-border bg-bg-card text-muted' : 'border-accent/40 bg-accent/10 text-accent'}"
                    >
                      {formatHabitLabel(habit)}
                    </button>
                  {/each}
                </div>
              </div>
              <div class="space-y-2">
                {#each filteredHabits.filter((h) => !hiddenHabits.includes(h.name)) as habit (habit.id)}
                  {@const stats = statsByHabitId.get(habit.id)}
                  {@const color = HABIT_COLOR_THEMES[habit.color]?.hex ?? 'var(--accent)'}
                  <div class="flex items-center gap-2">
                    <span class="w-4 shrink-0 text-sm">{habit.icon}</span>
                    <span class="w-16 shrink-0 truncate text-[10px] font-mono text-muted">{habit.name}</span>
                    <div class="h-5 min-w-0 flex-1 overflow-hidden rounded-sm bg-border">
                      <div
                        class="h-full rounded-sm transition-all duration-500"
                        style:width="{stats?.completionRate ?? 0}%"
                        style:background-color={color}
                        style:box-shadow="0 0 6px {color}60"
                      ></div>
                    </div>
                    <span class="w-8 shrink-0 text-right text-[10px] font-mono" style:color={color}>{stats?.completionRate ?? 0}%</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>

          <!-- Weekday breakdown -->
          <div class="rounded-lg border border-border bg-bg-secondary p-4">
            <h2 class="mb-4 text-xs font-mono uppercase tracking-wider text-muted">Weekday breakdown</h2>
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
            <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Habit performance</h2>
            <!-- Sort controls -->
            <div class="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span class="text-muted">Sort by</span>
              {#each (['rate', 'streak', 'name'] as const) as key, keyIdx (key + '-' + keyIdx)}
                <button
                  type="button"
                  onclick={() => handleSortChange(key)}
                  class="rounded-full px-3 py-1 text-[10px] transition-colors {habitSort === key ? 'bg-border text-foreground' : 'text-muted hover:text-foreground'}"
                >
                  {key}{#if habitSort === key}&nbsp;{habitSortDir === 'desc' ? '↓' : '↑'}{/if}
                </button>
              {/each}
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-[2fr,1fr]">
            <!-- Performance list -->
            <div class="rounded-lg border border-border bg-bg-secondary p-4 space-y-2">
              {#each sortedStats as entry, i (entry.habit.id)}
                {@const color = HABIT_COLOR_THEMES[entry.habit.color]?.hex ?? 'var(--accent)'}
                {@const status = habitStatusLabel(entry.stats.completionRate, entry.stats.currentStreak)}
                <button
                  type="button"
                  class="w-full flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-bg-card"
                  onclick={() => void goto(resolve('/(protected)/habit/[id]', { id: entry.habit.id }))}
                >
                  <span class="w-4 shrink-0 text-[10px] font-mono text-muted">{i + 1}</span>
                  <span class="text-base">{entry.habit.icon}</span>
                  <div class="min-w-0 flex-1 space-y-1">
                    <div class="flex items-center justify-between gap-2">
                      <span class="truncate text-xs font-medium text-foreground">{entry.habit.name}</span>
                      <div class="flex shrink-0 items-center gap-2">
                        <span class="text-[9px] font-mono {status.color}">{status.label}</span>
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
            <div class="min-w-0 rounded-lg border border-border bg-bg-secondary p-4">
              <h2 class="mb-3 text-xs font-mono uppercase tracking-wider text-muted">Weekly breakdown</h2>
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
        <div class="rounded-lg border border-border bg-bg-secondary p-3 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Activity — 90 days</h2>
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
