<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
  import { formatHabitLabel } from '$lib/habits/formatHabitLabel';
  import { habitStatusLabel } from '$lib/stats/statsCharts';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
  import type { Habit, HabitStats } from '@/types/habit';
  import { Flame } from 'lucide-svelte';

  type Entry = { habit: Habit; stats: HabitStats };

  type Props = {
    entries: Entry[];
    allStats: Entry[];
    sortDir: 'asc' | 'desc';
    onSortChange: (key: 'rate' | 'streak' | 'name') => void;
    hiddenHabits: string[];
    onToggleVisibility: (name: string) => void;
  };

  const { entries, allStats, sortDir, onSortChange, hiddenHabits, onToggleVisibility }: Props = $props();
</script>

<div class="space-y-4">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex min-w-0 items-center gap-2">
      <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Habit performance</h2>
      <ChartGuideTooltip
        title="Habit performance"
        summary="This ranking helps you compare habits by outcome, so you can see which routines are solid and which ones need intervention first."
        focusPoints={[
          'Completion rate: the fastest signal of reliability.',
          'Current streak: whether the habit still has live momentum.',
          'Status labels: quick flags for strong, steady, or struggling habits.'
        ]}
        variant="columns"
      />
    </div>
    <div class="flex flex-wrap items-center gap-2 text-[11px] font-mono">
      <span class="text-muted">Sort by</span>
      {#each (['rate', 'streak', 'name'] as const) as key, keyIdx (key + '-' + keyIdx)}
        <button
          type="button"
          onclick={() => onSortChange(key)}
          class="rounded-full px-3 py-1.5 text-[10px] transition-colors {sortDir === 'desc' ? 'bg-border text-foreground' : 'text-muted hover:text-foreground'}"
        >
          {key}
        </button>
      {/each}
    </div>
  </div>

  <div class="grid gap-4 md:grid-cols-[2fr,1fr]">
    <div class="rounded-[1.5rem] border border-border bg-bg-card/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] space-y-2">
      {#each entries as entry, i (entry.habit.id)}
        {@const color = HABIT_COLOR_THEMES[entry.habit.color]?.hex ?? 'var(--accent)'}
        {@const status = habitStatusLabel(entry.stats.completionRate, entry.stats.currentStreak, entry.stats.longestStreak)}
        <div class="w-full flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-bg-card {hiddenHabits.includes(entry.habit.name) ? 'opacity-40' : ''}">
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-3 text-left"
            onclick={() => void goto(resolve('/app/(protected)/habit/[id]', { id: entry.habit.id }))}
          >
            <span class="w-4 shrink-0 text-[10px] font-mono text-muted">{i + 1}</span>
            <span class="text-base">{entry.habit.icon}</span>
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex items-center justify-between gap-2">
                <span class="truncate text-xs font-medium text-foreground">{formatHabitLabel(entry.habit)}</span>
                <div class="flex shrink-0 items-center gap-2">
                  <span class="text-[9px] font-mono" style:color={status.color}>{status.label}</span>
                  <span class="text-[10px] font-mono" style:color={color}>{entry.stats.completionRate}%</span>
                </div>
              </div>
              <div class="h-1 overflow-hidden rounded-full bg-border">
                <div
                  class="h-full rounded-full"
                  style:width={`${entry.stats.completionRate}%`}
                  style:background-color={color}
                  style:box-shadow={`0 0 6px ${color}60`}
                ></div>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <Flame size={12} class="text-accent-secondary" />
              <span class="text-[10px] font-mono text-accent-secondary">{entry.stats.currentStreak}</span>
              <CompletionRing percentage={entry.stats.completionRate} size={28} strokeWidth={2} color={entry.habit.color} />
            </div>
          </button>
          <button
            type="button"
            class="ml-1 text-[10px] font-mono text-muted hover:text-foreground"
            onclick={(event) => {
              event.stopPropagation();
              onToggleVisibility(entry.habit.name);
            }}
            aria-label={hiddenHabits.includes(entry.habit.name) ? 'Show habit' : 'Hide habit'}
          >
            {hiddenHabits.includes(entry.habit.name) ? 'Show' : 'Hide'}
          </button>
        </div>
      {/each}
      {#if entries.length === 0}
        <p class="py-6 text-center text-xs text-muted">No habits match the current filters.</p>
      {/if}
    </div>

    <div class="min-w-0 rounded-[1.5rem] border border-border bg-bg-card/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div class="mb-3 flex min-w-0 items-center gap-2">
        <h2 class="min-w-0 text-xs font-mono uppercase tracking-wider text-muted">Weekly breakdown</h2>
        <ChartGuideTooltip
          title="Weekly breakdown"
          summary="This compact view compares recent weekly volume for every habit so you can see which ones stay active and which ones fade out."
          focusPoints={[
            'Bar height: how many days the habit was completed that week.',
            'Latest bars: whether the habit is strengthening or cooling off now.',
            'Right-side percent: overall completion rate for quick ranking.'
          ]}
          variant="columns"
        />
      </div>
      <div class="space-y-3">
        {#each allStats as entry (entry.habit.id)}
          {@const color = HABIT_COLOR_THEMES[entry.habit.color]?.hex ?? 'var(--accent)'}
          <div class="flex min-w-0 items-center gap-2 sm:gap-3">
            <span class="w-5 shrink-0 text-sm">{entry.habit.icon}</span>
            <span class="w-16 min-w-0 shrink-0 truncate text-[11px] font-mono text-muted sm:w-20">{formatHabitLabel(entry.habit)}</span>
            <div class="flex h-6 min-w-0 flex-1 items-center gap-[2px]">
              {#each entry.stats.weeklyData as week, wi (entry.habit.id + '-' + wi)}
                <div
                  class="flex-1 rounded-sm"
                  style:height={`${Math.max(2, (week.count / 7) * 100)}%`}
                  style:min-height="2px"
                  style:background-color={color}
                  style:opacity={`${0.3 + (wi / 12) * 0.7}`}
                ></div>
              {/each}
            </div>
            <span class="w-8 shrink-0 text-right text-[10px] font-mono" style:color={color}>{entry.stats.completionRate}%</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
