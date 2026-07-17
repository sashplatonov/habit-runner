<script lang="ts">
  import { Check, Clock3, Minus, Snowflake, X } from 'lucide-svelte';
  import Surface from '$lib/components/ui/Surface.svelte';
  import type { HabitDetailRhythmCell } from '$lib/habits/habitDetailViewModel';

  type Props = {
    cells: HabitDetailRhythmCell[];
  };

  const { cells }: Props = $props();

  const stateClass: Record<HabitDetailRhythmCell['state'], string> = {
    completed: 'border-progress/45 bg-progress/20 text-progress',
    missed: 'border-danger/45 bg-danger/12 text-danger',
    frozen: 'border-accent-secondary/40 bg-accent-secondary/12 text-accent-secondary',
    'not-scheduled': 'border-dashed border-border bg-bg-secondary text-muted',
    future: 'border-accent/25 bg-accent/6 text-muted'
  };

  const stateLabel: Record<HabitDetailRhythmCell['state'], string> = {
    completed: 'Done',
    missed: 'Missed',
    frozen: 'Frozen',
    'not-scheduled': 'Rest day',
    future: 'Upcoming'
  };
</script>

<Surface as="section" padding="lg" class="space-y-4">
  <div class="flex items-center justify-between gap-3">
    <div>
      <p class="text-[10px] font-mono uppercase tracking-[0.24em] text-muted">Consistency map</p>
      <h2 class="mt-1 text-base font-semibold text-foreground">Your 28-day rhythm</h2>
    </div>
    <p class="hidden text-xs text-muted sm:block">2 weeks back · 2 weeks ahead</p>
  </div>

  <ul class="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted" aria-label="Day status legend">
    <li class="inline-flex items-center gap-1.5">
      <span class="inline-flex size-5 items-center justify-center rounded-md border border-progress/45 bg-progress/20 text-progress" aria-hidden="true"><Check size={12} strokeWidth={2.5} /></span>
      Done
    </li>
    <li class="inline-flex items-center gap-1.5">
      <span class="inline-flex size-5 items-center justify-center rounded-md border border-danger/45 bg-danger/12 text-danger" aria-hidden="true"><X size={12} strokeWidth={2.5} /></span>
      Missed
    </li>
    <li class="inline-flex items-center gap-1.5">
      <span class="inline-flex size-5 items-center justify-center rounded-md border border-accent/25 bg-accent/6 text-muted" aria-hidden="true"><Clock3 size={11} /></span>
      Upcoming
    </li>
    <li class="inline-flex items-center gap-1.5">
      <span class="inline-flex size-5 items-center justify-center rounded-md border border-accent-secondary/40 bg-accent-secondary/12 text-accent-secondary" aria-hidden="true"><Snowflake size={11} /></span>
      Frozen
    </li>
    <li class="inline-flex items-center gap-1.5">
      <span class="inline-flex size-5 items-center justify-center rounded-md border border-dashed border-border bg-bg-secondary text-muted" aria-hidden="true"><Minus size={11} /></span>
      Rest day
    </li>
  </ul>

  <div class="grid grid-cols-7 gap-1.5 sm:gap-2" role="list" aria-label="Habit rhythm by day">
    {#each cells as cell, index (`${cell.dateKey}-${index}`)}
      <div
        class={`relative flex min-h-14 min-w-0 flex-col items-center justify-between rounded-[0.85rem] border p-1.5 text-center sm:min-h-20 sm:rounded-[1rem] sm:p-2 ${stateClass[cell.state]} ${cell.isToday ? 'ring-2 ring-foreground/70 ring-offset-2 ring-offset-bg-card' : ''}`}
        role="listitem"
        aria-label={`${cell.label}: ${stateLabel[cell.state]}${cell.isToday ? ', today' : ''}`}
        title={`${cell.label} – ${stateLabel[cell.state]}${cell.isToday ? ' (today)' : ''}`}
      >
        <p class="font-mono text-[10px] font-semibold tabular-nums sm:text-[9px] sm:uppercase sm:tracking-[0.12em]">
          <span class="sm:hidden">{cell.shortLabel}</span>
          <span class="hidden sm:inline">{cell.label}</span>
        </p>
        <span class="my-1 inline-flex size-5 items-center justify-center rounded-full bg-current/10 sm:size-6" aria-hidden="true">
          {#if cell.state === 'completed'}
            <Check size={14} strokeWidth={2.75} />
          {:else if cell.state === 'missed'}
            <X size={14} strokeWidth={2.75} />
          {:else if cell.state === 'future'}
            <Clock3 size={13} />
          {:else if cell.state === 'frozen'}
            <Snowflake size={13} />
          {:else}
            <Minus size={13} />
          {/if}
        </span>
        <p class="hidden truncate text-[10px] font-semibold sm:block">{stateLabel[cell.state]}</p>
        {#if cell.isToday}
          <span class="absolute -bottom-2 rounded-full bg-foreground px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-bg-card">Today</span>
        {/if}
      </div>
    {/each}
  </div>
</Surface>
