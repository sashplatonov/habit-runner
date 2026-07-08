<script lang="ts">
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import type { Habit } from '@/types/habit';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
  import type { HabitPeriodDataRow, PeriodOption } from '$lib/stats/statsPage';
  import {
    buildQuarterTickMeta,
    formatQuarterWeekLabel,
    parseQuarterPeriodLabel
  } from '$lib/stats/statsCharts';

  type Props = {
    habitPeriodData: HabitPeriodDataRow[];
    filteredHabits: Habit[];
    hiddenHabits: string[];
    toggleHabitVisibility: (name: string) => void;
    period: PeriodOption;
  };

  const { habitPeriodData, filteredHabits, hiddenHabits, toggleHabitVisibility, period }: Props = $props();

  const CHART_WIDTH = 420;
  const CHART_HEIGHT = 170;
  const PADDING = { top: 10, right: 10, bottom: 26, left: 26 } as const;
  const yTicks = [0, 25, 50, 75, 100] as const;

  function buildPolyline(points: Array<{ x: number; y: number }>) {
    return points.map((point) => `${point.x},${point.y}`).join(' ');
  }

  const visibleHabits = $derived(filteredHabits.filter((habit) => !hiddenHabits.includes(habit.name)));

  const xTicks = $derived.by(() => {
    const labels = habitPeriodData.map((entry) => String(entry.period ?? ''));

    if (period === 'quarter') {
      const meta = buildQuarterTickMeta(labels);
      return labels.map((label, index) => {
        const fallback = parseQuarterPeriodLabel(label);
        const tick = meta.get(index);
        return {
          primary: formatQuarterWeekLabel(tick?.weekLabel ?? fallback.weekLabel),
          secondary: tick?.isMonthStart ? tick.monthLabel : ''
        };
      });
    }

    if (period === 'month' && labels.length > 14) {
      return labels.map((label, index) => ({
        primary: index % 5 === 0 || index === labels.length - 1 ? label : '',
        secondary: ''
      }));
    }

    return labels.map((label) => ({ primary: label, secondary: '' }));
  });

  const series = $derived.by(() => {
    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const step = habitPeriodData.length > 1 ? innerWidth / (habitPeriodData.length - 1) : 0;

    return visibleHabits.map((habit) => {
      const color = HABIT_COLOR_THEMES[habit.color]?.hex ?? 'var(--accent)';
      const points = habitPeriodData.map((entry, index) => {
        const value = Number(entry[habit.name] ?? 0);
        return {
          x: PADDING.left + (habitPeriodData.length > 1 ? step * index : innerWidth / 2),
          y: PADDING.top + innerHeight - (value / 100) * innerHeight,
          value,
          label: String(entry.period ?? '')
        };
      });

      return {
        habit,
        color,
        points
      };
    });
  });
</script>

<div class="rounded-lg border border-border bg-bg-secondary p-4 space-y-4">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <div class="flex items-center gap-2">
        <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Period trends</h2>
        <ChartGuideTooltip
          title="Period trends"
          summary="Each line tracks how one habit performs over time, so you can compare momentum and spot drop-offs early."
          focusPoints={[
            'Trend direction: rising lines usually mean the habit is stabilizing.',
            'Line crossings: habits changing rank or losing priority.',
            'Flat low lines: habits that may need a simpler schedule or target.'
          ]}
          variant="line"
        />
      </div>
      <p class="text-[10px] font-mono text-muted">Tap to hide/show habits</p>
    </div>

    <div class="flex max-w-full flex-wrap gap-2">
      {#each filteredHabits as habit (habit.id)}
        <button
          type="button"
          onclick={() => toggleHabitVisibility(habit.name)}
          class="rounded-full border px-3 py-1 text-[10px] font-mono transition-colors {hiddenHabits.includes(habit.name) ? 'border-border bg-bg-card text-muted' : 'border-accent/40 bg-accent/10 text-accent'}"
        >
          {formatHabitLabel(habit)}
        </button>
      {/each}
    </div>
  </div>

  {#if habitPeriodData.length === 0}
    <p class="py-8 text-center text-xs text-muted">No data for this period</p>
  {:else if visibleHabits.length === 0}
    <p class="py-8 text-center text-xs text-muted">All habits are hidden. Toggle one back on to compare trends.</p>
  {:else}
    <div class="h-[170px]">
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} class="h-full w-full overflow-visible">
        {#each yTicks as tick (`grid-${tick}`)}
          {@const y = PADDING.top + (1 - tick / 100) * (CHART_HEIGHT - PADDING.top - PADDING.bottom)}
          <line x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={y} y2={y} stroke="var(--border)" stroke-dasharray="3 3"></line>
          <text x={PADDING.left - 6} y={y + 3} text-anchor="end" font-size="9" font-family="JetBrains Mono" fill="var(--text-muted)">{tick}%</text>
        {/each}

        {#each series as entry (entry.habit.id)}
          <polyline
            fill="none"
            stroke={entry.color}
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            points={buildPolyline(entry.points)}
          ></polyline>

          {#each entry.points as point, pointIndex (`${entry.habit.id}-${pointIndex}`)}
            <circle cx={point.x} cy={point.y} r="3" fill={entry.color}>
              <title>{`${formatHabitLabel(entry.habit)} - ${point.label}: ${point.value}%`}</title>
            </circle>
          {/each}
        {/each}
      </svg>
    </div>

    <div
      class="grid gap-[2px]"
      style:grid-template-columns={`repeat(${Math.max(xTicks.length, 1)}, minmax(0, 1fr))`}
    >
      {#each xTicks as tick, index (`tick-${index}`)}
        <div class="min-w-0 text-center">
          {#if tick.primary}
            <p class="truncate text-[8px] font-mono text-muted">{tick.primary}</p>
          {:else}
            <div class="h-[10px]"></div>
          {/if}
          {#if tick.secondary}
            <p class="text-[8px] font-mono text-muted/80">{tick.secondary}</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
