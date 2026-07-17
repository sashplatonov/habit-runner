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

<Surface as="section" padding="md" class="relative overflow-hidden" ariaLive="polite">
  <div aria-hidden="true" class="pointer-events-none absolute inset-0">
    <div class="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]"></div>
    <div class="absolute -left-20 top-0 h-56 w-56 rounded-full bg-accent/10 blur-3xl"></div>
    <div class="absolute right-[-4rem] top-[-3rem] h-56 w-56 rounded-full bg-progress/10 blur-3xl"></div>
  </div>

  <div class="relative grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)] lg:items-start">
    <div class="space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <span class="rounded-full border border-border bg-bg-secondary/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">
          {dateLabel}
        </span>
        <span class="rounded-full border border-border bg-bg-secondary/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">
          {summary.title}
        </span>
      </div>

      <div class="space-y-2">
        <h1 class="text-pretty text-[clamp(1.9rem,3.6vw,3.2rem)] font-semibold tracking-tight text-foreground">
          {summary.headline}
        </h1>
        <p class="max-w-2xl break-words text-sm leading-6 text-muted sm:text-base">
          {summary.message}
        </p>
      </div>

      <div class="space-y-2">
        <ProgressBar label={summary.progressLabel} value={summary.progressValue} tone={summary.progressTone} />
        <div class="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
          <span>{summary.state.replaceAll('-', ' ')}</span>
          {#if summary.isComplete}
            <span class="rounded-full border border-progress/30 bg-progress/10 px-2 py-1 text-progress">Complete</span>
          {/if}
        </div>
      </div>

      {#if summary.nextActionLabel && onPrimaryAction}
        <button
          type="button"
          class="inline-flex min-h-11 items-center gap-2 rounded-full border border-accent/25 bg-accent/12 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent/16"
          onclick={() => {
            void onPrimaryAction();
          }}
        >
          {summary.nextActionLabel}
        </button>
      {/if}
    </div>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-1">
      {#each summary.metrics as metric, metricIndex (metric.label + '-' + metricIndex)}
        <div class="rounded-[1.2rem] border border-border bg-bg-secondary/78 px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
          <div class="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
            {metric.label}
          </div>
          <div class={`mt-2 text-2xl font-semibold tabular-nums tracking-tight ${metricToneClasses[metric.tone ?? 'muted']}`}>
            {metric.value}
          </div>
        </div>
      {/each}
    </div>
  </div>
</Surface>
