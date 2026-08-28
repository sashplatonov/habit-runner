<script lang="ts">
  import { resolve } from '$app/paths';
  import { AlertCircle, CheckCircle2, MinusCircle } from 'lucide-svelte';
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
  const attention = $derived(section === 'Needs attention');
</script>

<article class="min-w-0 py-2.5 first:pt-0 last:pb-0" aria-label={`${label}, ${section}`}>
  <div class="flex min-w-0 items-center gap-2">
    <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-card text-accent" aria-hidden="true">
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
    <span class={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold tabular-nums ${attention ? 'border-danger/25 bg-danger/10 text-danger' : 'border-progress/25 bg-progress/10 text-progress'}`}>{percentage}</span>
  </div>

  <div class="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] font-mono">
    <span class="min-w-0 flex-1 truncate text-muted" title={model.insight}>{model.insight}</span>
    <span aria-hidden="true" class="text-muted/70">·</span>
    <span class={model.delta === null ? 'text-muted' : attention ? 'text-danger' : 'text-progress'}>{deltaLabel}</span>
    <ProgressSparkline points={model.trend} label={`${label} completion trend`} tone={attention ? 'attention' : 'progress'} compact />
  </div>

  <div class="mt-2 min-w-0">
    <ProgressHeatmapStrip cells={model.heatmap.slice(-7)} label={`${label} activity`} />
  </div>
</article>
