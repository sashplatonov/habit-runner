<script lang="ts">
  import type { HabitStats } from '@/types/habit';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import { buildMonthlyInsight } from '$lib/habits/detailHints';
  import type { HabitColorTheme } from '$lib/theme/habit-colors';

  type Props = {
    monthlyData: HabitStats['monthlyData'];
    accent: HabitColorTheme;
    habitCreatedAt: string;
  };

  type MonthlyPoint = {
    month: string;
    rate: number;
    x: number;
    y: number;
    left: string;
    top: string;
  };

  const { monthlyData, accent, habitCreatedAt }: Props = $props();

  let hoveredIndex = $state<number | null>(null);

  function clampRate(rate: number) {
    return Math.min(100, Math.max(0, rate));
  }

  function buildPoint(rate: number, index: number, total: number): MonthlyPoint {
    const x = total === 1 ? 50 : 8 + (index * 84) / (total - 1);
    const y = 88 - clampRate(rate) * 0.72;
    return {
      month: monthlyData[index]?.month ?? '',
      rate: monthlyData[index]?.rate ?? 0,
      x,
      y,
      left: `${x}%`,
      top: `${y}%`
    };
  }

  const points = $derived.by(() => monthlyData.map((entry, index) => buildPoint(entry.rate, index, monthlyData.length)));
  const activeIndex = $derived(hoveredIndex ?? (points.length > 0 ? points.length - 1 : null));
  const activePoint = $derived(activeIndex === null ? null : points[activeIndex] ?? null);
  const polylinePoints = $derived(points.map((point) => `${point.x},${point.y}`).join(' '));
  const yAxisTicks = $derived([100, 75, 50, 25, 0].map((value) => ({ value, y: 88 - value * 0.72 })));
  const insight = $derived(buildMonthlyInsight(monthlyData, habitCreatedAt));
  const InsightIcon = $derived(insight.icon);

  function tooltipLeft(point: MonthlyPoint): string {
    return `clamp(0px, calc(${point.x}% - 40px), calc(100% - 82px))`;
  }

  function tooltipTop(point: MonthlyPoint): string {
    return `calc(${point.y}% - 10px)`;
  }
</script>

<div class="rounded-lg border border-border bg-bg-secondary p-4">
  <div class="mb-4 flex items-center gap-2">
    <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Monthly completion rate</h2>
    <ChartGuideTooltip
      title="Monthly completion rate"
      summary="This line tracks the monthly success rate for one habit, helping you judge whether the habit is actually becoming stable over longer periods."
      focusPoints={[
        'Latest point: your current monthly baseline.',
        'Month-over-month slope: whether consistency is compounding or slipping.',
        'Repeated dips: a sign the habit may be too ambitious or poorly timed.'
      ]}
      variant="line"
    />
  </div>

  {#if points.length > 0}
    <div class="rounded-2xl border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-3">
      <div class="grid grid-cols-[2rem_minmax(0,1fr)] gap-2">
        <div class="relative h-28">
          {#each yAxisTicks as tick, tickIndex ('tick-label-' + tickIndex)}
            <span
              class="absolute right-0 -translate-y-1/2 text-[8px] font-mono text-muted"
              style:top="{tick.y}%"
            >{tick.value}%</span>
          {/each}
        </div>

        <div>
          <div class="relative h-28">
            <svg viewBox="0 0 100 100" class="absolute inset-0 h-full w-full overflow-visible">
              <line x1="8" y1="16" x2="8" y2="88" stroke="var(--border)" stroke-width="1.2"></line>
              <line x1="8" y1="88" x2="92" y2="88" stroke="var(--border)" stroke-width="1.2"></line>
              {#each yAxisTicks as tick, tickIndex ('grid-line-' + tickIndex)}
                <line x1="8" y1={tick.y} x2="92" y2={tick.y} stroke="var(--border)" stroke-dasharray="2 4"></line>
              {/each}
              <polyline
                fill="none"
                stroke={accent.hex}
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                points={polylinePoints}
                style="filter: drop-shadow(0 0 4px {accent.glow});"
              ></polyline>
              {#each points as point, pointIndex (point.month + '-' + pointIndex)}
                <line x1={point.x} y1="88" x2={point.x} y2="92" stroke="var(--border)" stroke-width="1"></line>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={activeIndex === pointIndex ? 3.8 : 2.7}
                  fill="var(--bg-primary)"
                  stroke={accent.hex}
                  stroke-width="2"
                ></circle>
              {/each}
            </svg>

            {#each points as point, pointIndex (point.month + '-hit-' + pointIndex)}
              <button
                type="button"
                class="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style:left={point.left}
                style:top={point.top}
                onclick={() => {
                  hoveredIndex = pointIndex;
                }}
                onmouseenter={() => {
                  hoveredIndex = pointIndex;
                }}
                onfocus={() => {
                  hoveredIndex = pointIndex;
                }}
                aria-label="{point.month}: {point.rate}%"
              ></button>
            {/each}

            {#if activePoint}
              <div
                class="pointer-events-none absolute z-10 rounded px-2 py-1.5 border border-border bg-bg-card"
                style:left={tooltipLeft(activePoint)}
                style:top={tooltipTop(activePoint)}
                style:transform="translateY(-100%)"
              >
                <p class="text-[10px] font-mono text-muted">{activePoint.month}</p>
                <p class="text-xs font-mono font-bold" style:color={accent.hex}>{activePoint.rate}%</p>
              </div>
            {/if}
          </div>

          <div class="mt-2 grid gap-1" style:grid-template-columns="repeat({Math.max(points.length, 1)}, minmax(0, 1fr))">
            {#each points as point, labelIndex (point.month + '-label-' + labelIndex)}
              <span class="truncate text-center text-[8px] font-mono text-muted">{point.month}</span>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}

  <div class="mt-3 flex items-center gap-1" style:color={insight.color}>
    <InsightIcon size={10} class="flex-shrink-0" />
    <p class="text-[10px] font-mono">{insight.text}</p>
  </div>
</div>