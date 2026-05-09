<script lang="ts">
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import { OVERVIEW_SIGNALS_TOOLTIP } from '$lib/habits/blockGuideTooltips';
  import { Calendar, Flame, TrendingUp, Zap } from 'lucide-svelte';
  import { habitsStore } from '$lib/stores/habits';
  import type { Habit } from '@/types/habit';

  type Props = {
    habits: Habit[];
  };

  const { habits }: Props = $props();

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
</script>

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
