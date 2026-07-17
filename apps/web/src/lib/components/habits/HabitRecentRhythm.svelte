<script lang="ts">
  import Surface from '$lib/components/ui/Surface.svelte';
  import type { HabitDetailRhythmCell } from '$lib/habits/habitDetailViewModel';

  type Props = {
    cells: HabitDetailRhythmCell[];
  };

  const { cells }: Props = $props();

  const stateClass: Record<HabitDetailRhythmCell['state'], string> = {
    completed: 'border-progress/30 bg-progress/20 text-foreground',
    missed: 'border-border bg-bg-secondary text-muted',
    frozen: 'border-accent/30 bg-accent/10 text-accent',
    'not-scheduled': 'border-dashed border-border bg-bg-secondary text-muted',
    future: 'border-border bg-bg-secondary/50 text-muted opacity-60'
  };
</script>

<Surface as="section" padding="lg" class="space-y-4">
  <div class="flex items-center justify-between gap-3">
    <div>
      <p class="text-[10px] font-mono uppercase tracking-[0.24em] text-muted">Recent rhythm</p>
      <h2 class="mt-1 text-base font-semibold text-foreground">Scheduled opportunities</h2>
    </div>
    <p class="text-xs text-muted">28-day window</p>
  </div>

  <div class="grid grid-cols-7 gap-1.5 sm:gap-2">
    {#each cells as cell, index (`${cell.dateKey}-${index}`)}
      <div
        class={`min-h-12 min-w-0 rounded-[0.85rem] border p-1.5 text-center sm:min-h-14 sm:rounded-[1rem] sm:p-2 sm:text-left ${stateClass[cell.state]}`}
        aria-label={`${cell.label}: ${cell.state}`}
        title={`${cell.label} – ${cell.state}`}
      >
        <p class="font-mono text-[10px] tabular-nums sm:text-[9px] sm:uppercase sm:tracking-[0.12em]">
          <span class="sm:hidden">{cell.shortLabel}</span>
          <span class="hidden sm:inline">{cell.label}</span>
        </p>
        <p class="mt-1 truncate text-[9px] font-semibold sm:text-[11px]">{cell.isToday ? 'Today' : cell.state}</p>
      </div>
    {/each}
  </div>
</Surface>
