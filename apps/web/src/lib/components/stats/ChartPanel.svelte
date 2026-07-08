<script lang="ts">
  import StatsDailyRateChart from '$lib/components/StatsDailyRateChart.svelte';
  import StatsTrendChart from '$lib/components/StatsTrendChart.svelte';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import type { Habit } from '@/types/habit';
  import type { HabitPeriodDataRow, PeriodOption, WeekdayStats } from '$lib/stats/statsPage';

  type Props = {
    avgRate: number;
    dailyData: Array<{ day: string; axisLabel: string; completed: number; total: number; rate: number }>;
    habitPeriodData: HabitPeriodDataRow[];
    filteredHabits: Habit[];
    hiddenHabits: string[];
    toggleHabitVisibility: (name: string) => void;
    period: PeriodOption;
    weekdayStats: WeekdayStats;
    onPeriodChange: (period: PeriodOption) => void;
  };

  const {
    avgRate,
    dailyData,
    habitPeriodData,
    filteredHabits,
    hiddenHabits,
    toggleHabitVisibility,
    period,
    weekdayStats,
    onPeriodChange
  }: Props = $props();

  const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
</script>

<div class="space-y-4">
  <div class="flex justify-end">
    <div class="flex items-center gap-1 rounded-full border border-border bg-bg-card px-1 py-1">
      {#each (['week', 'month', 'quarter', 'year'] as const) as opt, pIdx (opt + '-' + pIdx)}
        <button
          type="button"
          class="h-10 w-10 rounded-full text-xs font-mono transition-colors {period === opt ? 'bg-foreground text-bg-primary' : 'text-muted hover:text-foreground'}"
          onclick={() => onPeriodChange(opt)}
        >
          {opt === 'week' ? 'W' : opt === 'month' ? 'M' : opt === 'quarter' ? 'Q' : 'Y'}
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
              style:height={`${(count / maxCount) * 100}%`}
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
