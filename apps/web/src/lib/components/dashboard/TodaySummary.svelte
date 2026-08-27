<script lang="ts">
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import Surface from '$lib/components/ui/Surface.svelte';
  import type { TodaySummaryModel } from '$lib/dashboard/todaySummary';

  type Props = {
    summary: TodaySummaryModel;
    dateLabel: string;
    onPrimaryAction?: () => void | Promise<void>;
  };

  let { summary, dateLabel, onPrimaryAction }: Props = $props();

  const metricToneClasses: Record<NonNullable<TodaySummaryModel['metrics'][number]['tone']>, string> = {
    muted: 'text-muted',
    accent: 'text-accent',
    progress: 'text-progress',
    attention: 'text-attention'
  };
</script>

<Surface as="section" padding="sm" class="relative overflow-hidden p-2.5 sm:p-3" ariaLive="polite">
  <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-accent/10 via-accent/60 to-progress/20"></div>

  <div class="relative space-y-2 sm:space-y-3">
    <div class="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5 sm:gap-x-4 sm:gap-y-2">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          <span>{dateLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{summary.title}</span>
          {#if summary.isComplete}
            <span class="rounded-full border border-progress/30 bg-progress/10 px-2 py-0.5 text-progress">Complete</span>
          {/if}
        </div>
        <h1 class="mt-0.5 line-clamp-1 text-pretty text-base font-semibold tracking-tight text-foreground sm:mt-1 sm:text-xl sm:line-clamp-none">
          {summary.headline}
        </h1>
      </div>

      <div class="flex max-w-full flex-nowrap gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {#each summary.metrics as metric, metricIndex (metric.label + '-' + metricIndex)}
          <span class="rounded-full border border-border bg-bg-secondary/70 px-2.5 py-1 text-[11px] text-muted">
            {metric.label}
            <strong class={`ml-1 font-semibold tabular-nums ${metricToneClasses[metric.tone ?? 'muted']}`}>{metric.value}</strong>
          </span>
        {/each}
      </div>
    </div>

    <ProgressBar label={summary.progressLabel} value={summary.progressValue} tone={summary.progressTone} />

    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p class="line-clamp-1 min-w-0 break-words text-xs leading-5 text-muted sm:line-clamp-none sm:text-sm">
        {summary.message}
      </p>

      {#if summary.nextActionLabel && onPrimaryAction}
        <button
          type="button"
          class="inline-flex min-h-10 w-full min-w-0 shrink-0 items-center justify-center overflow-hidden rounded-full border border-accent/25 bg-accent/12 px-3 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent/16 sm:min-h-11 sm:w-auto sm:px-4"
          onclick={() => {
            void onPrimaryAction();
          }}
        >
          <span class="truncate whitespace-nowrap">{summary.nextActionLabel}</span>
        </button>
      {/if}
    </div>
  </div>
</Surface>
