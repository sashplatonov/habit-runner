<script lang="ts">
  import { AlertTriangle, CheckCircle2, Lightbulb, TrendingDown, TrendingUp } from 'lucide-svelte';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import {
    buildDailyChartInsight,
    buildQuarterTickMeta,
    formatQuarterWeekLabel,
    parseQuarterPeriodLabel
  } from '$lib/stats/statsCharts';
  import type { DailyDataPoint, PeriodOption } from '$lib/stats/statsPage';

  type Props = {
    avgRate: number;
    dailyData: DailyDataPoint[];
    period: PeriodOption;
  };

  const { avgRate, dailyData, period }: Props = $props();

  const insightIconMap = {
    success: CheckCircle2,
    up: TrendingUp,
    down: TrendingDown,
    alert: AlertTriangle,
    neutral: Lightbulb
  } as const;

  const insight = $derived(buildDailyChartInsight(avgRate, dailyData));
  const InsightIcon = $derived(insightIconMap[insight.tone]);

  const axisTicks = $derived.by(() => {
    if (period === 'quarter') {
      const meta = buildQuarterTickMeta(dailyData.map((entry) => String(entry.axisLabel ?? '')));
      return dailyData.map((entry, index) => {
        const fallback = parseQuarterPeriodLabel(String(entry.axisLabel ?? ''));
        const tick = meta.get(index);
        return {
          primary: formatQuarterWeekLabel(tick?.weekLabel ?? fallback.weekLabel),
          secondary: tick?.isMonthStart ? tick.monthLabel : ''
        };
      });
    }

    if (period === 'year') {
      return dailyData.map((entry) => ({
        primary: String(entry.axisLabel ?? ''),
        secondary: ''
      }));
    }

    if (period === 'month' && dailyData.length > 14) {
      return dailyData.map((entry, index) => ({
        primary: index % 5 === 0 || index === dailyData.length - 1 ? String(entry.axisLabel ?? '') : '',
        secondary: ''
      }));
    }

    return dailyData.map((entry) => ({
      primary: String(entry.axisLabel ?? ''),
      secondary: ''
    }));
  });
</script>

<div class="rounded-lg border border-border bg-bg-secondary p-4">
  <div class="mb-1 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Daily completion rate</h2>
      <ChartGuideTooltip
        title="Daily completion rate"
        summary="This chart shows how consistently you finished scheduled habits each day in the selected period."
        focusPoints={[
          'Average rate: your baseline consistency for this window.',
          'Low bars or gaps: days where routine friction is breaking momentum.',
          'Clusters of strong days: patterns worth repeating.'
        ]}
        variant="bars"
      />
    </div>
    <span class="text-[10px] font-mono text-accent">{avgRate}% avg</span>
  </div>
  <p class="mb-3 text-[10px] font-mono text-muted">Tap to hide/show habits</p>

  {#if dailyData.length === 0}
    <p class="py-8 text-center text-xs text-muted">No data for this period</p>
  {:else}
    <div class="flex h-[150px] items-end gap-[2px]">
      {#each dailyData as entry, index (entry.day + '-' + index)}
        <div class="group relative flex flex-1 flex-col items-center justify-end" title={`${entry.day}: ${entry.rate}%`}>
          <div
            class="w-full rounded-t-sm bg-accent transition-all duration-300"
            style:height={`${Math.max(2, entry.rate * 1.5)}px`}
            style:box-shadow="0 0 4px var(--glow)"
          ></div>
        </div>
      {/each}
    </div>

    <div
      class="mt-2 grid gap-[2px]"
      style:grid-template-columns={`repeat(${Math.max(axisTicks.length, 1)}, minmax(0, 1fr))`}
    >
      {#each axisTicks as tick, index (`tick-${index}`)}
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

  <div class="mt-3 flex items-center gap-1" style:color={insight.color}>
    <InsightIcon size={10} class="shrink-0"></InsightIcon>
    <p class="text-[10px] font-mono">{insight.text}</p>
  </div>
</div>