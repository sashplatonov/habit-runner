<script lang="ts">
  import StatsDailyRateChart from '$lib/components/StatsDailyRateChart.svelte';
  import StatsTrendChart from '$lib/components/StatsTrendChart.svelte';
  import HabitHeatmap from '$lib/components/HabitHeatmap.svelte';
  import type { Habit } from '@/types/habit';
  import type { PeriodOption } from '$lib/stats/statsPage';
  import { PERIOD_DISPLAY_NAMES } from '$lib/constants/stats';
  import {
    OVERVIEW_SIGNALS_TOOLTIP,
    YOUR_INVESTMENT_TOOLTIP,
    INSIGHTS_TOOLTIP
  } from '$lib/habits/blockGuideTooltips';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';

  type Props = {
    habits: Habit[];
    period: PeriodOption;
    dailyData: any;
    habitPeriodData: any;
    mergedCompletions: any;
    dayDetails: any;
    aggregateTarget: number;
    hiddenHabits: string[];
    onToggleVisibility: (name: string) => void;
  };

  const {
    habits,
    period,
    dailyData,
    habitPeriodData,
    mergedCompletions,
    dayDetails,
    aggregateTarget,
    hiddenHabits,
    onToggleVisibility,
  }: Props = $props();
</script>

<div class="space-y-4">
  <!-- Daily Rate Chart -->
  <div class="rounded-2xl border border-border bg-bg-card p-3">
    <div class="mb-3 flex items-center justify-between">
      <div>
        <p class="text-[9px] font-mono uppercase tracking-[0.3em] text-muted">Daily Rate</p>
        <p class="text-xs text-muted">{PERIOD_DISPLAY_NAMES[period] ?? period} completion rate</p>
      </div>
      <ChartGuideTooltip {...OVERVIEW_SIGNALS_TOOLTIP} triggerClassName="h-7 w-7" />
    </div>
    <StatsDailyRateChart
      avgRate={habits.length > 0 ? habits.reduce((s, h) => s + (h.stats?.completionRate ?? 0), 0) / habits.length : 0}
      dailyData={dailyData}
      {period}
      chartHeight={180}
    />
  </div>

  <!-- Trend Chart -->
  <div class="rounded-2xl border border-border bg-bg-card p-3">
    <div class="mb-3 flex items-center justify-between">
      <div>
        <p class="text-[9px] font-mono uppercase tracking-[0.3em] text-muted">Trend</p>
        <p class="text-xs text-muted">Completion trend over time</p>
      </div>
      <ChartGuideTooltip {...INSIGHTS_TOOLTIP} triggerClassName="h-7 w-7" />
    </div>
    <StatsTrendChart
      habitPeriodData={habitPeriodData}
      filteredHabits={habits}
      hiddenHabits={hiddenHabits}
      toggleHabitVisibility={onToggleVisibility}
      {period}
      chartHeight={200}
    />
  </div>

  <!-- Heatmap -->
  <div class="rounded-2xl border border-border bg-bg-card p-3">
    <div class="mb-3 flex items-center justify-between">
      <div>
        <p class="text-[9px] font-mono uppercase tracking-[0.3em] text-muted">Heatmap</p>
        <p class="text-xs text-muted">Activity distribution</p>
      </div>
      <ChartGuideTooltip {...YOUR_INVESTMENT_TOOLTIP} triggerClassName="h-7 w-7" />
    </div>
    <HabitHeatmap
      habits={habits}
      {habitPeriodData}
      {period}
    />
  </div>
</div>
