<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Plus } from 'lucide-svelte';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import type { Habit } from '@/types/habit';

  type Props = {
    habits: Habit[];
    period: string;
    onPeriodChange: (period: string) => void;
    periodOptions: { id: string; label: string }[];
    periodDisplayNames: Record<string, string>;
  };

  const { habits, period, onPeriodChange, periodOptions, periodDisplayNames }: Props = $props();

  const habitCount = $derived(habits.length);
  const activeCount = $derived(habits.filter(h => !h.archived).length);
  
  function getPeriodButtonClass(periodId: string) {
    const isActive = period === periodId;
    return {
      'rounded-lg border px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors': true,
      'bg-accent/10': isActive,
      'border-accent/30': isActive,
      'border-border': !isActive,
      'text-accent': isActive,
      'text-muted': !isActive
    };
  }
</script>

<div class="flex items-center justify-between gap-2">
  <div>
    <h1 class="text-sm font-mono uppercase tracking-[0.3em] text-muted">Stats</h1>
    <p class="text-[10px] text-muted">
      {activeCount} active / {habitCount} total habits
    </p>
  </div>
  <div class="flex items-center gap-2">
    {#each periodOptions as opt (opt.id)}
      <button
        type="button"
        onclick={() => onPeriodChange(opt.id)}
        class={getPeriodButtonClass(opt.id)}
        aria-pressed={period === opt.id}
        aria-label="Period: {periodDisplayNames[opt.id] ?? opt.label}"
      >
        {opt.label}
      </button>
    {/each}
    <button
      type="button"
      onclick={() => goto(resolve('app/(protected)/habit/new'))}
      class="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent/50 hover:text-accent"
      aria-label="Add new habit"
    >
      <Plus size={14} />
    </button>
  </div>
</div>
