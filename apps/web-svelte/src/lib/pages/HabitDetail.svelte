<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import {
    ArrowLeft, Edit, Flame, Target, TrendingUp, Calendar,
    Trash2, Archive, ArchiveRestore, Snowflake, ChevronLeft, ChevronRight,
    CheckCircle2, AlertTriangle, Lightbulb, BarChart2, TrendingDown
  } from 'lucide-svelte';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
  import HabitHeatmap from '$lib/components/HabitHeatmap.svelte';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import DescriptionTooltip from '$lib/components/DescriptionTooltip.svelte';
  import { habitsStore, setCompletionCount, getHabitStats, deleteHabit, restoreHabit, updateHabit, toggleFreezeDay } from '$lib/stores/habitsStore';
  import { undoStore } from '$lib/stores/undoStore';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
  import { formatDate } from '$lib/habits/habitStats';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import { completionKeyToCalendarDate } from '$lib/completionKey';
  import { isScheduledForDate, resolveHabitSchedule } from '$lib/habits/schedule';
  import { getHabitPhase, HABIT_PHASES } from '$lib/habits/phases';
  import { getAutomatismLevelDetailed, getAutomatismMessageDetailed, getAutomatismColorDetailed } from '$lib/habits/automatism';
  import { getStreakHint, getBestHint, getRateHint, getRateColor, getTotalHint, getHabitAgeDays, getRateWindowLabel } from '$lib/habits/habitDetailHelpers';
  import { TARGET_STREAK_TOOLTIP } from '$lib/constants/blockGuideTooltips';
  import type { Habit } from '$lib/types/habit';

  // Route param
  const habitId = $derived($page.params.id);
  const allHabits = $derived($habitsStore);
  const habit = $derived(allHabits.find((h) => h.id === habitId));

  // Today
  const todayFormatted = formatDate(new Date());
  const todayFreezeKey = completionKeyToCalendarDate(todayFormatted);

  // Derived
  const stats = $derived(habit ? getHabitStats(habitId) : null);
  const accent = $derived(habit ? HABIT_COLOR_THEMES[habit.color] : HABIT_COLOR_THEMES.indigo);
  const dailyTarget = $derived(Math.max(1, habit?.dailyTarget ?? 1));
  const todayCount = $derived(habit?.completions[todayFormatted] ?? 0);
  const completedToday = $derived(todayCount >= dailyTarget);
  const canIncrement = $derived(todayCount < dailyTarget);
  const isTodayFrozen = $derived(habit ? habit.freezeDays.includes(todayFreezeKey) : false);

  // Stat card helpers
  const habitAgeDays = $derived(habit ? getHabitAgeDays(habit.createdAt) : 0);
  const rateWindowLabel = $derived(getRateWindowLabel(habitAgeDays));
  const streakHint = $derived(stats ? getStreakHint(stats.currentStreak, stats.longestStreak) : null);
  const bestHint = $derived(stats ? getBestHint(stats.longestStreak) : null);
  const rateHint = $derived(stats ? getRateHint(habitAgeDays, stats.completionRate) : null);
  const totalHint = $derived(stats ? getTotalHint(stats.completedDays) : null);
  const rateColor = $derived(stats ? getRateColor(habitAgeDays, stats.completionRate) : 'text-muted');
  const phase = $derived(stats ? getHabitPhase(stats.currentStreak) : null);

  // Automatism
  const automatismScore = $derived(stats?.automatismScore ?? 0);
  const automatismLevel = $derived(getAutomatismLevelDetailed(automatismScore, accent.hex));
  const automatismMessage = $derived(getAutomatismMessageDetailed(automatismScore));
  const automatismColor = $derived(getAutomatismColorDetailed(automatismScore));

  // Monthly insight
  const monthlyInsight = $derived.by(() => {
    if (!stats || !habit) return null;
    const data = stats.monthlyData;
    if (data.length < 2 || habitAgeDays < 14) return { text: 'Complete more weeks to see monthly trends.', color: 'var(--text-muted)' };
    const last = data[data.length - 1].rate;
    const prev = data[data.length - 2].rate;
    const trend = last - prev;
    if (last >= 80 && trend >= 0) return { text: `${last}% last month — excellent, keep this up.`, color: 'var(--accent)' };
    if (trend >= 15) return { text: `Up ${trend}% from last month — great momentum!`, color: 'var(--accent)' };
    if (trend <= -15) return { text: `Down ${Math.abs(trend)}% this month. What changed?`, color: 'var(--accent-secondary)' };
    if (last < 40) return { text: 'Low rate. Try habit stacking or reduce the target.', color: 'var(--accent-secondary)' };
    return { text: `${last}% this month. Consistent effort adds up.`, color: 'var(--text-muted)' };
  });

  // Weekly insight
  const weeklyInsight = $derived.by(() => {
    if (!stats || !habit) return null;
    const data = stats.weeklyData;
    if (data.length < 4 || habitAgeDays < 14) return null;
    const lastWeek = data[data.length - 1].count;
    const recentAvg = data.slice(-3).reduce((s, w) => s + w.count, 0) / 3;
    const earlierAvg = data.slice(-6, -3).reduce((s, w) => s + w.count, 0) / 3;
    const trend = recentAvg - earlierAvg;
    if (lastWeek === 7) return { text: 'Perfect last week — all 7 days!', color: 'var(--accent)' };
    if (trend > 1.5) return { text: 'Weekly completions trending up — great momentum.', color: 'var(--accent)' };
    if (trend < -1.5) return { text: 'Completions dropping. Try pairing with an existing habit.', color: 'var(--accent-secondary)' };
    if (lastWeek === 0) return { text: 'No completions last week. Start fresh today.', color: 'var(--accent-secondary)' };
    return { text: `${lastWeek}/7 days last week. Aim for one more.`, color: 'var(--text-muted)' };
  });

  // Heatmap
  const heatmapDayDetails = $derived.by(() => {
    if (!habit) return {};
    const details: Record<string, string[]> = {};
    for (const [date, count] of Object.entries(habit.completions)) {
      if (count >= dailyTarget) details[date] = [formatHabitLabel(habit)];
    }
    return details;
  });
  const completedCount = $derived(habit ? Object.keys(habit.completions).length : 0);

  // Target ring
  const targetStreak = $derived(habit?.targetStreak ?? 21);
  const remaining = $derived(stats ? targetStreak - stats.currentStreak : 0);
  const streakHintText = $derived.by(() => {
    if (!stats) return '';
    if (stats.currentStreak >= targetStreak) return 'Target reached! Set a new challenge.';
    if (stats.currentStreak === 0) return `Start today — ${targetStreak} days to reach your target.`;
    return `${remaining} more day${remaining === 1 ? '' : 's'} to hit your ${targetStreak}-day target.`;
  });
  const streakHintColor = $derived.by(() => {
    if (!stats) return 'text-muted';
    if (stats.currentStreak >= targetStreak) return 'text-accent';
    if (stats.currentStreak > targetStreak * 0.5) return 'text-accent-secondary';
    return 'text-muted';
  });

  // Confirm delete
  let confirmDelete = $state(false);

  // Retro calendar
  let displayDate = $state(new Date());
  const retroGrid = $derived.by(() => {
    if (!habit) return { weeks: [] as RetroDay[][], monthCount: 0 };
    const schedule = resolveHabitSchedule(habit);
    return buildRetroGrid(habit, schedule, displayDate);
  });
  const maxValue = $derived(dailyTarget);
  const monthYearLabel = $derived(displayDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }));
  const isCurrentMonth = $derived(displayDate.getMonth() === new Date().getMonth() && displayDate.getFullYear() === new Date().getFullYear());
  const disableNextMonth = $derived(
    displayDate.getFullYear() > new Date().getFullYear() ||
    (displayDate.getFullYear() === new Date().getFullYear() && displayDate.getMonth() >= new Date().getMonth())
  );

  let retroEditor = $state<{ date: string; pendingValue: number; anchorX: number; anchorY: number } | null>(null);

  // --- Handlers ---
  async function handleIncrement() {
    if (!habit) return;
    const prev = todayCount;
    const next = Math.min(dailyTarget, prev + 1);
    await setCompletionCount(habitId, todayFormatted, next);
    undoStore.push({
      label: `Progress ${next}/${dailyTarget}: ${habit.name}`,
      execute: async () => { await setCompletionCount(habitId, todayFormatted, prev); }
    });
  }

  async function handleDecrement() {
    if (!habit || todayCount <= 0) return;
    const prev = todayCount;
    const next = prev - 1;
    await setCompletionCount(habitId, todayFormatted, next);
    undoStore.push({
      label: next > 0 ? `Completed ${next}x today` : `Reset for today`,
      execute: async () => { await setCompletionCount(habitId, todayFormatted, prev); }
    });
  }

  async function handleToggleArchive() {
    if (!habit) return;
    await updateHabit(habitId, { archived: !habit.archived });
  }

  async function handleToggleFreeze() {
    if (!habit) return;
    const nextFrozen = await toggleFreezeDay(habitId, todayFreezeKey);
    if (nextFrozen !== undefined) {
      undoStore.push({ label: nextFrozen ? 'Habit frozen for today' : 'Habit unfrozen for today' });
    }
  }

  async function handleDelete() {
    const deleted = await deleteHabit(habitId);
    if (deleted) {
      undoStore.push({
        label: `Habit "${deleted.name}" was deleted`,
        execute: async () => { await restoreHabit(deleted); }
      });
    }
    void goto('/');
  }

  // Retro calendar handlers
  function handleRetroDayClick(day: RetroDay, e: MouseEvent) {
    if (day.isFuture || day.isEmpty) return;
    if (maxValue > 1) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      retroEditor = {
        date: day.date,
        pendingValue: Math.max(0, Math.min(maxValue, Math.trunc(day.count))),
        anchorX: rect.left + rect.width / 2,
        anchorY: rect.top
      };
    } else {
      void setCompletionCount(habitId, day.date, day.count > 0 ? 0 : 1);
    }
  }

  async function applyRetroEdit() {
    if (!retroEditor) return;
    await setCompletionCount(habitId, retroEditor.date, Math.max(0, Math.min(maxValue, Math.trunc(retroEditor.pendingValue))));
    retroEditor = null;
  }

  async function resetRetroEdit() {
    if (!retroEditor) return;
    await setCompletionCount(habitId, retroEditor.date, 0);
    retroEditor = null;
  }

  // --- Retro grid builder ---
  type RetroDay = {
    date: string; dayOfMonth: number; scheduled: boolean; count: number;
    isToday: boolean; isFuture: boolean; isEmpty: boolean;
    dayOfWeek: number; isWeekend: boolean; monthIndex?: number; isFrozen: boolean;
  };

  function buildRetroGrid(h: Habit, schedule: ReturnType<typeof resolveHabitSchedule>, refDate: Date) {
    const now = new Date();
    const todayKey = formatDate(now);
    const startDate = new Date(refDate);
    startDate.setDate(startDate.getDate() - 29);
    const weekStartOffset = (startDate.getDay() + 6) % 7;
    const paddedStart = new Date(startDate);
    paddedStart.setDate(paddedStart.getDate() - weekStartOffset);
    const days: RetroDay[] = [];
    for (let i = 0; i < weekStartOffset; i++) {
      const d = new Date(paddedStart); d.setDate(paddedStart.getDate() + i);
      days.push({ date: formatDate(d), dayOfMonth: d.getDate(), scheduled: false, count: 0, isToday: false, isFuture: false, isEmpty: true, dayOfWeek: d.getDay(), isWeekend: d.getDay() === 0 || d.getDay() === 6, isFrozen: false });
    }
    const monthIndexMap = new Map<number, number>();
    const regMonth = (m: number) => { if (!monthIndexMap.has(m)) monthIndexMap.set(m, monthIndexMap.size); return monthIndexMap.get(m)!; };
    for (let i = 0; i < 30; i++) {
      const d = new Date(startDate); d.setDate(startDate.getDate() + i);
      const dk = formatDate(d);
      const fk = completionKeyToCalendarDate(dk);
      const wd = d.getDay();
      days.push({
        date: dk, dayOfMonth: d.getDate(), scheduled: isScheduledForDate(schedule, d),
        count: h.completions[dk] ?? 0, isToday: dk === todayKey, isFuture: d > now,
        isEmpty: false, dayOfWeek: wd, isWeekend: wd === 0 || wd === 6,
        monthIndex: regMonth(d.getMonth()), isFrozen: (h.freezeDays ?? []).includes(fk)
      });
    }
    const weeks: RetroDay[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    return { weeks, monthCount: monthIndexMap.size };
  }

  function retroDayBg(day: RetroDay): string {
    if (day.isEmpty || day.isFuture) return 'transparent';
    if (day.count >= maxValue) return accent.heatmapLevels[4];
    if (day.count > 0) return accent.heatmapLevels[3];
    return 'var(--bg-card)';
  }

  const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
</script>

{#if !habit || !stats}
  <div class="min-h-screen bg-bg-primary flex items-center justify-center">
    <div class="text-muted font-mono">Habit not found</div>
  </div>
{:else}
  <div class="min-h-screen bg-bg-primary">
    <!-- Header -->
    <div
      class="border-b border-border bg-bg-primary px-4 sticky top-0 z-10"
      style="top: var(--safe-area-inset-top, 0px); padding-top: calc(var(--safe-area-inset-top, 0px) + 1rem); padding-bottom: 1rem"
    >
      <div class="max-w-2xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <button onclick={() => goto('/')} aria-label="Back to dashboard" class="text-muted hover:text-foreground transition-colors p-1 -ml-1 flex-shrink-0">
            <ArrowLeft size={16} />
          </button>
          <span class="text-xl flex-shrink-0">{habit.icon}</span>
          <div class="flex-1 min-w-0">
            <h1 class="text-base font-semibold text-foreground break-words sm:truncate">{habit.name}</h1>
            {#if habit.description}
              <div class="flex items-center gap-1 min-w-0">
                <p class="text-[11px] text-muted truncate">{habit.description}</p>
                <DescriptionTooltip description={habit.description} />
              </div>
            {/if}
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 sm:justify-end">
          <button onclick={handleToggleArchive} aria-label={habit.archived ? 'Unarchive' : 'Archive'}
            class="p-1.5 rounded border transition-colors {habit.archived ? 'border-accent-secondary/30 text-accent-secondary bg-accent-secondary/10' : 'border-border text-muted hover:text-foreground hover:border-border-hover'}">
            {#if habit.archived}<ArchiveRestore size={13} />{:else}<Archive size={13} />{/if}
          </button>
          <button onclick={() => goto(`/habit/${habitId}/edit`)} aria-label="Edit habit" class="p-1.5 rounded border border-border text-muted hover:text-foreground hover:border-border-hover transition-colors">
            <Edit size={13} />
          </button>
          <button onclick={handleIncrement} disabled={!canIncrement}
            class="px-3 py-1.5 rounded text-xs font-mono font-medium border transition-all duration-200 {completedToday ? 'border-border text-muted bg-transparent' : 'text-bg-primary font-bold'} disabled:opacity-40 disabled:cursor-not-allowed"
            style={!completedToday ? `background-color: ${accent.hex}; border-color: ${accent.hex}; box-shadow: 0 0 16px ${accent.glow}` : ''}>
            {completedToday ? 'Done' : 'Add +1'}
          </button>
          <button onclick={handleDecrement} disabled={todayCount <= 0}
            class="px-3 py-1.5 rounded text-xs font-mono font-medium border border-border text-muted transition disabled:opacity-40 disabled:cursor-not-allowed hover:border-border-hover hover:text-foreground">
            -1
          </button>
          <button onclick={handleToggleFreeze} aria-label={isTodayFrozen ? 'Unfreeze today' : 'Freeze today'}
            class="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded border transition-colors {isTodayFrozen ? 'border-accent text-accent bg-accent/15' : 'border-border text-muted hover:text-foreground hover:border-border-hover'}">
            <Snowflake size={11} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>

    <div class="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <!-- Stat cards -->
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <h2 class="text-xs font-mono text-muted uppercase tracking-wider">Key metrics</h2>
          <ChartGuideTooltip title="Key metrics" summary="Four cards: live streak, personal best, completion rate, and total volume." focusPoints={['Streak: whether the habit is alive.', 'Best and rate: current form vs. ceiling.', 'Total completions: long-term proof.']} variant="columns" triggerClassName="h-7 w-7" />
        </div>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <!-- Streak -->
          <div class="bg-bg-secondary border border-border rounded-lg p-3">
            <div class="flex items-center gap-1 mb-2">
              <Flame size={10} class="text-accent-secondary" />
              <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Streak</span>
              <span class="ml-auto">
                <ChartGuideTooltip title="Adaptive phases" summary="Your streak passes through 4 science-backed phases." focusPoints={HABIT_PHASES.map(p => `${p.name} (${p.range}d): ${p.description}`)} variant="columns" triggerClassName="h-5 w-5" />
              </span>
            </div>
            <div class="text-xl font-mono font-bold text-accent-secondary">{stats.currentStreak}</div>
            <div class="text-[9px] font-mono text-muted">days</div>
            {#if phase && stats.currentStreak > 0}
              <div class="flex items-center gap-0.5 mt-0.5 mb-0.5">
                <span class="text-[9px] font-mono text-muted">{phase.name}</span>
              </div>
            {/if}
            {#if streakHint}
              <div class="flex items-center gap-0.5 mt-1 {stats.currentStreak === 0 ? 'text-accent-secondary' : stats.currentStreak >= stats.longestStreak ? 'text-accent' : 'text-muted'}">
                <span class="text-[9px] font-mono">{streakHint.text}</span>
              </div>
            {/if}
          </div>
          <!-- Best -->
          <div class="bg-bg-secondary border border-border rounded-lg p-3">
            <div class="flex items-center gap-1 mb-2">
              <Target size={10} style="color: {accent.hex}" />
              <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Best</span>
            </div>
            <div class="text-xl font-mono font-bold" style="color: {accent.hex}">{stats.longestStreak}</div>
            <div class="text-[9px] font-mono text-muted">days</div>
            {#if bestHint}
              <div class="flex items-center gap-0.5 mt-1 {stats.longestStreak >= 21 ? 'text-accent' : stats.longestStreak >= 7 ? 'text-accent-secondary' : 'text-muted'}">
                <span class="text-[9px] font-mono">{bestHint.text}</span>
              </div>
            {/if}
          </div>
          <!-- Rate -->
          <div class="bg-bg-secondary border border-border rounded-lg p-3">
            <div class="flex items-center gap-1 mb-2">
              <TrendingUp size={10} class="text-accent-secondary" />
              <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Rate</span>
            </div>
            <div class="text-xl font-mono font-bold {rateColor}">{stats.completionRate}%</div>
            <div class="text-[9px] font-mono text-muted">{rateWindowLabel}</div>
            {#if rateHint}
              <div class="flex items-center gap-0.5 mt-1 {rateColor}">
                <span class="text-[9px] font-mono">{rateHint.text}</span>
              </div>
            {/if}
          </div>
          <!-- Total -->
          <div class="bg-bg-secondary border border-border rounded-lg p-3">
            <div class="flex items-center gap-1 mb-2">
              <Calendar size={10} class="text-muted" />
              <span class="text-[9px] font-mono text-muted uppercase tracking-wider">Total</span>
            </div>
            <div class="text-xl font-mono font-bold text-foreground">{stats.completedDays}</div>
            <div class="text-[9px] font-mono text-muted">days</div>
            {#if totalHint}
              <div class="flex items-center gap-0.5 mt-1 {stats.completedDays >= 100 ? 'text-accent' : 'text-muted'}">
                <span class="text-[9px] font-mono">{totalHint.text}</span>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Automatism -->
      <div class="bg-bg-secondary border border-border rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-mono text-muted uppercase tracking-widest">Habit Strength</span>
              <ChartGuideTooltip title="Habit strength" summary="Automatism estimates how embedded this habit is." focusPoints={['Higher score: less friction.', 'Level badge: current maturity stage.', 'Use drops as a signal to simplify.']} variant="line" triggerClassName="h-7 w-7" />
            </div>
            <span class="text-lg font-bold text-foreground">Automatism: {automatismScore}%</span>
          </div>
          <div class="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border" style="border-color: {automatismLevel.color}; color: {automatismLevel.color}">
            {automatismLevel.label}
          </div>
        </div>
        <div class="h-2 bg-border rounded-full overflow-hidden">
          <div class="h-full transition-all duration-1000 ease-out" style="width: {automatismScore}%; background-color: {accent.hex}; box-shadow: 0 0 10px {accent.glow}"></div>
        </div>
        <p class="text-[10px] font-mono mt-2" style="color: {automatismColor}">{automatismMessage}</p>
      </div>

      <!-- Today block -->
      <div class="bg-bg-secondary border border-border rounded-2xl p-4">
        <div class="mb-2 flex items-center gap-2">
          <div class="text-[11px] font-mono text-muted uppercase tracking-[0.5em]">Today</div>
          <ChartGuideTooltip title="Today progress" summary="How much of today's quota is complete." focusPoints={['Current count vs target.', 'Use +1/-1 controls above.', 'Keep logging until quota is filled.']} variant="bars" triggerClassName="h-7 w-7" />
        </div>
        <p class="text-sm text-foreground">
          Completed <span class="font-mono font-bold" style="color: {accent.hex}">{todayCount}</span> / {dailyTarget} today.
        </p>
        <p class="text-[11px] text-muted mt-1">Reminder settings are available on the edit screen.</p>
      </div>

      <!-- Heatmap -->
      <div class="bg-bg-secondary border border-border rounded-lg p-3 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h2 class="text-xs font-mono text-muted uppercase tracking-wider">Activity - 90 days</h2>
            <ChartGuideTooltip title="Activity heatmap" summary="Completion over the last 90 days." focusPoints={['Bright runs = streaks.', 'Sparse patches = slips.', 'Recent density = current strength.']} variant="grid" />
          </div>
          <span class="text-[10px] font-mono text-muted">{completedCount} completions</span>
        </div>
        <div class="w-full mx-auto lg:max-w-[560px]">
          <HabitHeatmap completions={habit.completions} dailyTarget={dailyTarget} color={habit.color} dayDetails={heatmapDayDetails} />
        </div>
      </div>

      <!-- Target ring -->
      <div class="bg-bg-secondary border border-border rounded-lg p-4 flex items-center gap-4">
        <CompletionRing percentage={stats.completionRate} size={72} strokeWidth={5} color={habit.color} showText />
        <div class="flex-1">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono text-muted">Target streak</span>
              <ChartGuideTooltip {...TARGET_STREAK_TOOLTIP} triggerClassName="h-7 w-7" />
            </div>
            <span class="text-xs font-mono" style="color: {accent.hex}">{stats.currentStreak}/{targetStreak}d</span>
          </div>
          <div class="h-1.5 bg-border rounded-full overflow-hidden mb-2">
            <div class="h-full rounded-full transition-all duration-700" style="width: {Math.min(100, (stats.currentStreak / targetStreak) * 100)}%; background-color: {accent.hex}; box-shadow: 0 0 8px {accent.glow}"></div>
          </div>
          <p class="text-[9px] font-mono mb-2 {streakHintColor}">{streakHintText}</p>
          <div class="flex gap-2 flex-wrap">
            {#each habit.tags as tag}
              <span class="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-border bg-bg-card text-foreground">
                <span class="w-1.5 h-1.5 rounded-full" style="background-color: {accent.hex}"></span>{tag}
              </span>
            {/each}
          </div>
        </div>
      </div>

      <!-- Monthly rate (bar chart simplified without Recharts) -->
      {#if stats.monthlyData.length > 0}
        <div class="bg-bg-secondary border border-border rounded-lg p-4">
          <div class="mb-4 flex items-center gap-2">
            <h2 class="text-xs font-mono text-muted uppercase tracking-wider">Monthly completion rate</h2>
            <ChartGuideTooltip title="Monthly completion rate" summary="Monthly success rate line for this habit." focusPoints={['Latest point: current baseline.', 'Slope: compounding vs slipping.', 'Dips: too ambitious or poor timing.']} variant="line" />
          </div>
          <div class="flex items-end gap-1 h-24">
            {#each stats.monthlyData as m, i}
              <div class="flex-1 flex flex-col items-center gap-0.5">
                <div
                  class="w-full rounded-sm transition-all"
                  style="height: {Math.max(2, m.rate)}%; background-color: {accent.hex}; opacity: {0.4 + (i / stats.monthlyData.length) * 0.6}; {i === stats.monthlyData.length - 1 ? `box-shadow: 0 0 8px ${accent.glow}` : ''}"
                ></div>
                <span class="text-[8px] font-mono text-muted truncate w-full text-center">{m.month}</span>
              </div>
            {/each}
          </div>
          {#if monthlyInsight}
            <div class="flex items-center gap-1 mt-3" style="color: {monthlyInsight.color}">
              <p class="text-[10px] font-mono">{monthlyInsight.text}</p>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Weekly completions -->
      {#if stats.weeklyData.length > 0}
        <div class="bg-bg-secondary border border-border rounded-lg p-4">
          <div class="mb-3 flex items-center gap-2">
            <h2 class="text-xs font-mono text-muted uppercase tracking-wider">Weekly completions</h2>
            <ChartGuideTooltip title="Weekly completions" summary="Week-by-week volume comparison." focusPoints={['Taller bars: improving.', 'Falling bars: momentum loss.', 'Last week: current traction.']} variant="columns" />
          </div>
          <div class="flex items-end gap-1 h-16">
            {#each stats.weeklyData as w, i}
              <div class="flex-1 flex flex-col items-center gap-1">
                <div
                  class="w-full rounded-sm transition-all"
                  style="height: {(w.count / 7) * 100}%; min-height: 2px; background-color: {accent.hex}; opacity: {0.4 + (i / stats.weeklyData.length) * 0.6}; {i === stats.weeklyData.length - 1 ? `box-shadow: 0 0 8px ${accent.glow}` : ''}"
                ></div>
              </div>
            {/each}
          </div>
          <div class="flex justify-between mt-1 mb-2">
            <span class="text-[9px] font-mono text-muted">12w ago</span>
            <span class="text-[9px] font-mono text-muted">this week</span>
          </div>
          {#if weeklyInsight}
            <div class="flex items-center gap-1" style="color: {weeklyInsight.color}">
              <p class="text-[10px] font-mono">{weeklyInsight.text}</p>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Retro Calendar -->
      <div class="bg-bg-secondary border border-border rounded-2xl p-3 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <div>
            <h2 class="text-[11px] font-mono text-muted uppercase tracking-[0.5em]">Retro calendar</h2>
          </div>
          <span class="text-[11px] font-mono text-muted">30d</span>
        </div>
        <!-- Month navigation -->
        <div class="flex items-center justify-between gap-2 pt-1">
          <button onclick={() => { const d = new Date(displayDate); d.setMonth(d.getMonth() - 1); displayDate = d; }}
            class="flex items-center justify-center w-7 h-7 rounded border border-border hover:border-border-hover text-muted hover:text-foreground transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onclick={() => displayDate = new Date()}
            class="text-xs font-mono uppercase tracking-wider transition-colors {isCurrentMonth ? 'text-foreground font-semibold' : 'text-muted hover:text-foreground'}">
            {monthYearLabel}
          </button>
          <button onclick={() => { const d = new Date(displayDate); d.setMonth(d.getMonth() + 1); displayDate = d; }}
            disabled={disableNextMonth}
            class="flex items-center justify-center w-7 h-7 rounded border border-border hover:border-border-hover text-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronRight size={16} />
          </button>
        </div>
        <!-- Grid -->
        <div class="w-full mx-auto lg:max-w-[248px]">
          <div class="grid grid-cols-7 gap-1.5 sm:gap-2">
            {#each DAY_HEADERS as d}
              <div class="text-center text-[9px] font-mono text-muted uppercase tracking-wider py-0.5">{d}</div>
            {/each}
          </div>
          <div class="space-y-1.5 sm:space-y-2">
            {#each retroGrid.weeks as week, wi}
              <div class="grid grid-cols-7 gap-1.5 sm:gap-2">
                {#each week as day}
                  {#if day.isEmpty}
                    <div class="aspect-square w-full"></div>
                  {:else}
                    <button
                      type="button"
                      onclick={(e) => handleRetroDayClick(day, e)}
                      disabled={day.isFuture}
                      class="aspect-square w-full rounded-md border flex flex-col items-center justify-center transition-all duration-150 relative overflow-hidden {day.isFuture ? 'opacity-30 cursor-not-allowed' : 'hover:brightness-110'} {day.isToday ? 'ring-1' : ''}"
                      style="background-color: {retroDayBg(day)}; border-color: {day.scheduled ? accent.hex : 'var(--border)'}; border-style: {day.scheduled ? 'solid' : 'dashed'}; {day.count >= maxValue ? `box-shadow: 0 0 10px ${accent.glow}` : ''} {day.isToday ? `--tw-ring-color: ${accent.hex}` : ''}"
                      aria-label="{day.date} {day.count}/{maxValue}"
                    >
                      <span class="text-[9px] font-mono leading-none {day.count >= maxValue ? 'font-bold text-foreground' : day.isToday ? 'font-semibold' : 'text-muted'}"
                        style={day.isToday && day.count < maxValue ? `color: ${accent.hex}` : ''}>
                        {day.dayOfMonth}
                      </span>
                      {#if day.count > 0 && maxValue > 1}
                        <span class="text-[7px] font-mono text-foreground/60 leading-none">{day.count}/{maxValue}</span>
                      {/if}
                      {#if day.isFrozen}
                        <span class="absolute top-1 right-1 text-[8px] text-accent-secondary"><Snowflake size={10} strokeWidth={2} /></span>
                      {/if}
                    </button>
                  {/if}
                {/each}
              </div>
            {/each}
          </div>
        </div>

        <!-- Editor popover -->
        {#if retroEditor}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="fixed inset-0 z-40" onclick={() => retroEditor = null}></div>
          <div
            class="fixed z-50 w-[200px] rounded-2xl border border-border bg-bg-primary p-3 shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
            style="left: {Math.max(12, Math.min(retroEditor.anchorX - 100, (typeof window !== 'undefined' ? window.innerWidth : 400) - 212))}px; top: {Math.max(12, retroEditor.anchorY - 160)}px"
          >
            <div class="flex items-center justify-between">
              <p class="text-[10px] font-mono" style="color: {accent.hex}">{retroEditor.date}</p>
              <button onclick={() => retroEditor = null} class="text-[12px] font-bold text-muted">×</button>
            </div>
            <div class="mt-3 flex items-center justify-between gap-4">
              <button type="button" onclick={() => retroEditor && (retroEditor = { ...retroEditor, pendingValue: Math.max(0, retroEditor.pendingValue - 1) })}
                disabled={retroEditor.pendingValue <= 0} class="w-9 h-9 rounded-full border border-border text-sm leading-none disabled:text-muted">–</button>
              <span class="text-sm font-semibold text-foreground">{retroEditor.pendingValue}/{maxValue}</span>
              <button type="button" onclick={() => retroEditor && (retroEditor = { ...retroEditor, pendingValue: Math.min(maxValue, retroEditor.pendingValue + 1) })}
                disabled={retroEditor.pendingValue >= maxValue} class="w-9 h-9 rounded-full border border-border text-sm leading-none disabled:text-muted">+</button>
            </div>
            <div class="mt-3 flex gap-2">
              <button type="button" onclick={() => void applyRetroEdit()}
                class="flex-1 rounded-lg border border-border bg-accent/10 px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-accent transition hover:bg-accent/20"
                style="box-shadow: 0 0 8px {accent.glow}">Save</button>
              <button type="button" onclick={() => void resetRetroEdit()}
                class="flex-1 rounded-lg border border-border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.3em] text-muted transition hover:border-border-hover">Reset</button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Danger zone -->
      <div class="border border-border rounded-lg p-4">
        <h2 class="text-xs font-mono text-muted uppercase tracking-wider mb-3">Danger zone</h2>
        {#if !confirmDelete}
          <button onclick={() => confirmDelete = true}
            class="flex items-center gap-2 text-xs font-mono text-accent hover:text-accent-secondary/80 border border-accent/20 hover:border-accent/40 px-3 py-2 rounded transition-colors">
            <Trash2 size={12} /> Delete habit
          </button>
        {:else}
          <div class="flex items-center gap-3">
            <span class="text-xs font-mono text-muted">Are you sure?</span>
            <button onclick={() => void handleDelete()}
              class="text-xs font-mono text-accent border border-accent/40 px-3 py-1.5 rounded hover:bg-accent/10 transition-colors">Delete</button>
            <button onclick={() => confirmDelete = false}
              class="text-xs font-mono text-muted border border-border px-3 py-1.5 rounded hover:text-foreground transition-colors">Cancel</button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
