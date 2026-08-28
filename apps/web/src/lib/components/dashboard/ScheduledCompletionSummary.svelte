<script lang="ts">
  import Surface from '$lib/components/ui/Surface.svelte';
  import type {
    ScheduledCompletionDay,
    ScheduledCompletionSummary as SummaryModel
  } from '$lib/dashboard/scheduledCompletionSummary';

  type Props = {
    summary: SummaryModel;
    dateLabel: string;
  };

  let { summary, dateLabel }: Props = $props();

  const levelClasses: Record<1 | 2 | 3 | 4, string> = {
    1: 'bg-accent/20',
    2: 'bg-accent/40',
    3: 'bg-accent/65',
    4: 'bg-accent'
  };

  function cellClass(day: ScheduledCompletionDay): string {
    if (day.state === 'neutral') {
      return 'border border-dashed border-border bg-bg-secondary/70';
    }
    return levelClasses[day.brightnessLevel ?? 1];
  }

  function dayLabel(day: ScheduledCompletionDay): string {
    if (day.state === 'neutral') {
      return `${day.calendarDate}: no habits scheduled`;
    }
    return `${day.calendarDate}: ${day.completed} of ${day.required} scheduled habits completed`;
  }

  function scoreLabel(percentage: number | null): string {
    return percentage === null ? '—' : `${percentage}%`;
  }

  function segmentLabel(index: number): string {
    const segment = summary.today.segments[index];
    return `Scheduled habit ${index + 1}: ${segment.completed ? 'completed' : 'incomplete'}`;
  }

  function todayBarLabel(): string {
    if (summary.today.required === 0) {
      return 'Today: no habits are scheduled';
    }
    return `Today: ${summary.today.completed} of ${summary.today.required} scheduled habits completed, ${scoreLabel(summary.today.percentage)}`;
  }

  function heatmapDescription(): string {
    return summary.days.map(dayLabel).join('; ');
  }

  function todayBarDescription(): string {
    if (summary.today.segments.length === 0) {
      return 'No habits are scheduled today';
    }
    return summary.today.segments.map((_, index) => segmentLabel(index)).join('; ');
  }
</script>

<div role="region" aria-label="Scheduled completion summary">
<Surface as="section" padding="none" class="relative overflow-hidden">
  <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-accent/10 via-accent/60 to-progress/20" aria-hidden="true"></div>
  <p class="sr-only" aria-live="polite">{todayBarLabel()}</p>

  <div data-layout="desktop" class="desktop-summary p-4 sm:p-5">
    <div class="flex items-end justify-between gap-6">
      <div class="min-w-0">
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{dateLabel}</p>
        <h1 class="mt-1 text-xl font-semibold tracking-tight text-foreground">Daily completion</h1>
      </div>
      <div class="flex shrink-0 items-end gap-5 text-right">
        <div>
          <strong class="block text-xl font-semibold tabular-nums text-foreground">{summary.perfectDays}</strong>
          <span class="text-[10px] uppercase tracking-[0.12em] text-muted">perfect days</span>
        </div>
        <div>
          <strong class="block text-xl font-semibold tabular-nums text-foreground">{scoreLabel(summary.today.percentage)}</strong>
          <span class="text-[10px] uppercase tracking-[0.12em] text-muted">today</span>
        </div>
      </div>
    </div>

    <div class="mt-5 border-t border-border/60 pt-4">
      <div class="mb-2 flex items-center justify-between gap-3">
        <span class="text-xs text-muted">30 days</span>
        <span class="text-[11px] text-muted">Brighter means more complete</span>
      </div>
      <div class="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-1" role="img" aria-label="30-day scheduled completion heatmap" aria-describedby="scheduled-completion-desktop-heatmap-description">
        {#each summary.days as day, index (day.calendarDate + '-' + index)}
          <span class={`h-3.5 rounded-[3px] ${cellClass(day)}`} aria-label={dayLabel(day)} title={dayLabel(day)}></span>
        {/each}
      </div>
      <span id="scheduled-completion-desktop-heatmap-description" class="sr-only">{heatmapDescription()}</span>
      <div class="mt-2 flex items-center gap-1.5 text-[10px] text-muted" aria-label="Heatmap brightness legend">
        <span class="h-2.5 w-2.5 rounded-sm border border-dashed border-border bg-bg-secondary/70" aria-hidden="true"></span>
        <span>none scheduled</span>
        <span class="ml-1 h-2.5 w-2.5 rounded-sm bg-accent/20" aria-hidden="true"></span>
        <span>incomplete</span>
        <span class="h-2.5 w-2.5 rounded-sm bg-accent" aria-hidden="true"></span>
        <span>complete</span>
      </div>
    </div>

    <div class="mt-4 border-t border-border/60 pt-4">
      <div class="flex items-center justify-between gap-3 text-xs">
        <div class="min-w-0">
          <strong class="font-semibold tabular-nums text-foreground">{summary.today.completed}/{summary.today.required}</strong>
          <span class="ml-1 text-muted">scheduled habits only</span>
        </div>
        <strong class="shrink-0 text-base font-semibold tabular-nums text-foreground">{scoreLabel(summary.today.percentage)}</strong>
      </div>
      <div class="mt-2 grid min-w-0 gap-1" style={`grid-template-columns: repeat(${Math.max(summary.today.segments.length, 1)}, minmax(0, 1fr));`} role="img" aria-label={todayBarLabel()} aria-describedby="scheduled-completion-desktop-today-description">
        {#each summary.today.segments as segment, index (segment.habitId + '-' + index)}
          <span class={`h-3.5 min-w-0 rounded-[3px] ${segment.completed ? 'bg-accent' : 'bg-bg-secondary/80 border border-border'}`} aria-label={segmentLabel(index)}></span>
        {/each}
        {#if summary.today.segments.length === 0}
          <span class="h-3.5 rounded-[3px] border border-dashed border-border bg-bg-secondary/70" aria-label="No habits are scheduled today"></span>
        {/if}
      </div>
      <span id="scheduled-completion-desktop-today-description" class="sr-only">{todayBarDescription()}</span>
    </div>
  </div>

  <div data-layout="mobile" class="mobile-summary gap-1.5 p-2.5">
    <div class="grid min-w-0 grid-cols-[70px_minmax(0,1fr)_42px] items-center gap-1.5">
      <strong class="text-xs font-extrabold text-foreground">Completion</strong>
      <span class="truncate text-[11px] text-muted">{dateLabel} · scheduled only</span>
      <strong class="text-right text-xs font-extrabold tabular-nums text-foreground">{scoreLabel(summary.today.percentage)}</strong>
    </div>
    <div class="grid min-w-0 grid-cols-[70px_minmax(0,1fr)_42px] items-center gap-1.5">
      <span class="text-[11px] text-muted">30 days</span>
      <div class="grid min-w-0 grid-cols-[repeat(30,minmax(0,1fr))] gap-px" role="img" aria-label="30-day scheduled completion heatmap" aria-describedby="scheduled-completion-mobile-heatmap-description">
        {#each summary.days as day, index (day.calendarDate + '-' + index)}
          <span class={`h-1.5 min-w-0 rounded-[2px] ${cellClass(day)}`} aria-label={dayLabel(day)}></span>
        {/each}
      </div>
      <span class="text-right text-xs font-extrabold tabular-nums text-foreground">{summary.perfectDays}✓</span>
    </div>
    <div class="grid min-w-0 grid-cols-[70px_minmax(0,1fr)_42px] items-center gap-1.5">
      <span class="text-[11px] text-muted">Today {summary.today.completed}/{summary.today.required}</span>
      <div class="grid min-w-0 gap-px" style={`grid-template-columns: repeat(${Math.max(summary.today.segments.length, 1)}, minmax(0, 1fr));`} role="img" aria-label={todayBarLabel()} aria-describedby="scheduled-completion-mobile-today-description">
        {#each summary.today.segments as segment, index (segment.habitId + '-' + index)}
          <span class={`h-1.5 min-w-0 rounded-[2px] ${segment.completed ? 'bg-accent' : 'border border-border bg-bg-secondary/80'}`} aria-label={segmentLabel(index)}></span>
        {/each}
        {#if summary.today.segments.length === 0}
          <span class="h-1.5 rounded-[2px] border border-dashed border-border bg-bg-secondary/70" aria-label="No habits are scheduled today"></span>
        {/if}
      </div>
      <strong class="text-right text-xs font-extrabold tabular-nums text-foreground">{scoreLabel(summary.today.percentage)}</strong>
    </div>
  </div>
  <span id="scheduled-completion-mobile-heatmap-description" class="sr-only">{heatmapDescription()}</span>
  <span id="scheduled-completion-mobile-today-description" class="sr-only">{todayBarDescription()}</span>
</Surface>
</div>

<style>
  .desktop-summary {
    display: none;
  }

  .mobile-summary {
    display: grid;
  }

  @media (min-width: 561px) {
    .desktop-summary {
      display: block;
    }

    .mobile-summary {
      display: none;
    }
  }
</style>
