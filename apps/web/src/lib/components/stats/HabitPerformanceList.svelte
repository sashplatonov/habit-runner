<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import { habitsStore } from '$lib/stores/habits';
  import { habitStatusLabel } from '$lib/stats/statsCharts';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
  import type { Habit, HabitStats } from '@/types/habit';
  import { Zap, TrendingUp, TrendingDown } from 'lucide-svelte';

  type Entry = { habit: Habit; stats: HabitStats };

  type Props = {
    entries: Entry[];
    sortDir: 'asc' | 'desc';
    onSortChange: (key: 'rate' | 'streak' | 'name') => void;
    hiddenHabits: string[];
    onToggleVisibility: (name: string) => void;
  };

  const { entries, sortDir, onSortChange, hiddenHabits, onToggleVisibility }: Props = $props();

  function handleSort(key: 'rate' | 'streak' | 'name') {
    onSortChange(key);
  }
</script>

<div class="space-y-3">
  <div class="flex items-center gap-3 text-[9px] font-mono uppercase tracking-[0.3em] text-muted">
    <span class="flex-1">Habit</span>
    <button type="button" class="hover:text-foreground" onclick={() => handleSort('rate')}>
      Rate {sortDir === 'desc' ? '↓' : '↑'}
    </button>
    <button type="button" class="hover:text-foreground" onclick={() => handleSort('streak')}>
      Streak {sortDir === 'desc' ? '↓' : '↑'}
    </button>
    <span class="w-16 text-right">Status</span>
  </div>

  {#each entries as { habit, stats } (habit.id)}
    <div class="flex items-center gap-3 rounded-xl border border-border bg-bg-card p-3 transition-colors {hiddenHabits.includes(habit.name) ? 'opacity-40' : ''}">
      <button
        type="button"
        class="flex-1 flex items-center gap-2 text-left"
        onclick={() => goto(resolve('app/(protected)/habit/[id]', { id: habit.id }))}
      >
        <span class="text-sm">{formatHabitLabel(habit)}</span>
      </button>

      <span class="w-12 text-right text-xs font-mono {stats.completionRate >= 80 ? 'text-accent' : 'text-foreground'}">
        {stats.completionRate}%
      </span>

      <span class="flex w-12 items-center justify-end gap-1 text-xs font-mono {stats.currentStreak > 0 ? 'text-accent' : 'text-muted'}">
        {#if stats.currentStreak > 0}
          <Zap size={10} />
        {/if}
        {stats.currentStreak}
      </span>

      <span class="w-16 text-right text-[10px] font-mono {stats.completionRate >= 80 ? 'text-accent' : 'text-muted'}">
        {habitStatusLabel(stats)}
      </span>

      <button
        type="button"
        class="text-[10px] font-mono text-muted hover:text-foreground"
        onclick={() => onToggleVisibility(habit.name)}
        aria-label={hiddenHabits.includes(habit.name) ? 'Show habit' : 'Hide habit'}
      >
        {hiddenHabits.includes(habit.name) ? 'Show' : 'Hide'}
      </button>
    </div>
  {/each}
</div>
