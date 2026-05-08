<script lang="ts">
  import type { Habit } from '@/types/habit';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import { habitsStore } from '$lib/stores/habits';
  import { STREAK_MESSAGES, STREAK_THRESHOLDS } from '$lib/constants/stats';
  import { Lightbulb, Flame, Dumbbell, Sprout } from 'lucide-svelte';
  import type { PeriodOption } from '$lib/stats/statsPage';
  import { PERIOD_DISPLAY_NAMES } from '$lib/constants/stats';

  type Props = {
    habits: Habit[];
    period: PeriodOption;
  };

  const { habits, period }: Props = $props();

  // Summary KPIs
  const allStats = $derived(
    habits.map((habit) => ({ habit, stats: habitsStore.getHabitStats(habit.id) }))
  );

  const avgRate = $derived.by(() => {
    if (allStats.length === 0) return 0;
    return Math.round(allStats.reduce((s, e) => s + e.stats.completionRate, 0) / allStats.length);
  });
  const bestStreak = $derived(allStats.length > 0 ? Math.max(...allStats.map((e) => e.stats.longestStreak)) : 0);
  const totalCompletions = $derived(allStats.reduce((s, e) => s + e.stats.completedDays, 0));
  const currentStreaks = $derived(allStats.filter((e) => e.stats.currentStreak > 0).length);

  // Streak insight
  const streakLeader = $derived(allStats.length > 0
    ? allStats.reduce((best, next) => next.stats.longestStreak > best.stats.longestStreak ? next : best, allStats[0])
    : null
  );
  const days = $derived(streakLeader?.stats.longestStreak ?? 0);
  const streakIcon = $derived(
    days >= STREAK_THRESHOLDS.AUTOMATISM_MIN ? Flame :
    days >= STREAK_THRESHOLDS.MOMENTUM_MIN ? Dumbbell : Sprout
  );
  const streakBody = $derived.by(() => {
    if (days >= STREAK_THRESHOLDS.AUTOMATISM_MIN) {
      return STREAK_MESSAGES.AUTOMATISM(formatHabitLabel(streakLeader!.habit), days);
    } else if (days >= STREAK_THRESHOLDS.MOMENTUM_MIN) {
      return STREAK_MESSAGES.MOMENTUM_ENCOURAGEMENT(days, formatHabitLabel(streakLeader!.habit));
    } else if (days > 0) {
      return STREAK_MESSAGES.EARLY_STAGE(days);
    }
    return STREAK_MESSAGES.NO_STREAK;
  });
</script>

<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
  <!-- KPI cards -->
  <div class="rounded-2xl border border-border bg-bg-card p-3">
    <p class="text-[9px] font-mono uppercase tracking-[0.3em] text-muted">Avg Rate</p>
    <p class="text-xl font-bold text-foreground">{avgRate}<span class="ml-0.5 text-sm font-normal text-muted">%</span></p>
  </div>
  <div class="rounded-2xl border border-border bg-bg-card p-3">
    <p class="text-[9px] font-mono uppercase tracking-[0.3em] text-muted">Best Streak</p>
    <p class="text-xl font-bold text-foreground">{bestStreak}<span class="ml-0.5 text-sm font-normal text-muted">days</span></p>
  </div>
  <div class="rounded-2xl border border-border bg-bg-card p-3">
    <p class="text-[9px] font-mono uppercase tracking-[0.3em] text-muted">Completions</p>
    <p class="text-xl font-bold text-foreground">{totalCompletions}</p>
  </div>
  <div class="rounded-2xl border border-border bg-bg-card p-3">
    <p class="text-[9px] font-mono uppercase tracking-[0.3em] text-muted">Active Streaks</p>
    <p class="text-xl font-bold text-foreground">{currentStreaks}<span class="ml-0.5 text-sm font-normal text-muted">/{habits.length}</span></p>
  </div>
</div>

<!-- Streak insight -->
{#if streakLeader}
  <div class="flex items-start gap-3 rounded-2xl border border-border bg-bg-card p-3">
    <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
      <svelte:component this={streakIcon} size={14} />
    </div>
    <div>
      <p class="text-[9px] font-mono uppercase tracking-[0.3em] text-muted">Best streak</p>
      <p class="text-xs leading-relaxed text-foreground">{streakBody}</p>
    </div>
  </div>
{/if}
