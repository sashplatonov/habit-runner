<script lang="ts">
  import { addDaysToCalendarDate } from '@habbit-runner/shared';
  import { completionKeyToCalendarDate, calendarDateToCompletionKey } from '@/lib/completionKey';
  import type { HabitColor } from '@/types/habit';
  import { formatDate } from '$lib/habits/habitStats';
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';

  type Props = {
    completions: Record<string, number>;
    dailyTarget?: number;
    color: HabitColor;
  };

  let { completions, dailyTarget = 1, color }: Props = $props();

  const days = $derived.by(() => {
    // formatDate returns a canonical completion key (YYYY-MM-DDT00:00:00Z).
    // Convert to plain calendar date (YYYY-MM-DD) before using addDaysToCalendarDate.
    const todayKey = completionKeyToCalendarDate(formatDate(new Date()));
    return Array.from({ length: 30 }, (_, index) => addDaysToCalendarDate(todayKey, -(29 - index)));
  });
  const palette = $derived(HABIT_COLOR_THEMES[color]);
</script>

<div class="flex w-full items-center gap-[2px]" data-heatmap-row>
  {#each days as dateKey, di (dateKey + '-' + di)}
    {@const lookupKey = calendarDateToCompletionKey(dateKey)}
    {@const isCompleted = (completions[lookupKey] ?? 0) >= dailyTarget}
    <div
      class="h-[7px] w-[7px] flex-shrink-0 rounded-[2px] transition-[background-color,box-shadow,opacity] duration-300 sm:h-[8px] sm:w-[8px]"
      data-date={dateKey}
      data-heatmap-cell
      data-lookup-key={lookupKey}
      data-completed={isCompleted}
      style:background-color={isCompleted ? palette.hex : 'var(--border)'}
      style:box-shadow={isCompleted ? `0 0 4px ${palette.glow}` : 'none'}
      style:opacity={isCompleted ? 1 : 0.5}
    ></div>
  {/each}
</div>
