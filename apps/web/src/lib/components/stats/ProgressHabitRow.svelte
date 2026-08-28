<script lang="ts">
  import { resolve } from '$app/paths';
  import { AlertCircle, CheckCircle2, MinusCircle } from 'lucide-svelte';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import ProgressHeatmapStrip from '$lib/components/stats/ProgressHeatmapStrip.svelte';
  import ProgressSparkline from '$lib/components/stats/ProgressSparkline.svelte';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import type { HabitAnalyticsModel } from '$lib/stats/modernStats';

  type Props = {
    model: HabitAnalyticsModel;
    detailHref: string;
    section?: string;
  };

  const { model, detailHref, section = 'Habit progress' }: Props = $props();
  const label = $derived(formatHabitLabel(model.habit));
  const percentage = $derived(model.completionRate === null ? '—' : `${model.completionRate}%`);
  const deltaLabel = $derived(model.delta === null ? 'Unavailable' : `${model.delta > 0 ? '+' : ''}${model.delta} pp`);
</script>

<article class="min-w-0 rounded-2xl border border-border bg-bg-card p-3" aria-label={`${label}, ${section}`}>
  <div class="flex min-w-0 items-center gap-2">
    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-secondary text-accent" aria-hidden="true">
      {#if model.completionRate === null}
        <MinusCircle size={17} />
      {:else if model.completionRate >= 80}
        <CheckCircle2 size={17} />
      {:else}
        <AlertCircle size={17} />
      {/if}
    </span>
    <a href={resolve(detailHref, {})} class="min-w-0 flex-1 truncate text-sm font-semibold text-foreground underline-offset-4 hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card">
      {label}
    </a>
    <ChartGuideTooltip title="Section meaning" summary="This section groups habits by the strongest observable signal in the selected period." focusPoints={[section, model.reason]} variant="bars" triggerClassName="h-9 w-9" />
  </div>

  <div class="mt-2 flex min-w-0 items-center gap-2 text-[11px] font-mono">
    <ChartGuideTooltip title="Completion metric" summary="Completion is completed scheduled opportunities divided by all scheduled opportunities." focusPoints={['The denominator includes scheduled opportunities only.', 'A dash means there were no scheduled opportunities.']} variant="bars" triggerClassName="h-8 w-8" />
    <span class="tabular-nums text-sm font-semibold text-foreground">{percentage}</span>
    <ChartGuideTooltip title="Period delta" summary="Delta is the difference between this period and the directly previous equivalent period, measured in percentage points." focusPoints={['Positive values indicate improvement.', 'Unavailable means one comparison window had no opportunities.']} variant="columns" triggerClassName="h-8 w-8" />
    <span class={model.delta === null ? 'text-muted' : model.delta >= 0 ? 'text-accent' : 'text-danger'}>{deltaLabel}</span>
    <span class="truncate text-muted">{model.completed}/{model.scheduled} scheduled</span>
  </div>

  <div class="mt-2 flex min-w-0 items-center gap-2">
    <span class="min-w-0 flex-1 truncate text-xs text-muted" title={model.insight}>{model.insight}</span>
    <ChartGuideTooltip title="Trend" summary="The sparkline shows the ordered result of each day in the selected period." focusPoints={['Higher points indicate completed opportunities.', 'A flat neutral line means there is not enough trend data.']} variant="line" triggerClassName="h-8 w-8" />
    <ProgressSparkline points={model.trend} label={`${label} completion trend`} />
  </div>

  <div class="mt-2 min-w-0">
    <ProgressHeatmapStrip cells={model.heatmap} label={`${label} activity`} showGuide />
  </div>
</article>
