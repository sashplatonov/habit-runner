<script lang="ts">
  import { addDaysToCalendarDate, calendarDateToDate } from '@habbit-runner/shared';
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
    const todayKey = formatDate(new Date());
    return Array.from({ length: 30 }, (_, index) => addDaysToCalendarDate(todayKey, -(29 - index)));
  });
  const startDay = $derived(days[0] ? calendarDateToDate(days[0]).getDay() : 0);
  const emptyCells = $derived(Array.from({ length: startDay }));
  const palette = $derived(HABIT_COLOR_THEMES[color]);
</script>

<div class="grid grid-flow-col grid-rows-7 gap-[2px]">
  {#each emptyCells as _, index (`empty-${index}`)}
    <div class="h-[4px] w-[4px] rounded-[1px] bg-transparent"></div>
  {/each}

  {#each days as dateKey, di (dateKey + '-' + di)}
    {@const isCompleted = (completions[dateKey] ?? 0) >= dailyTarget}
    <div
      class="h-[4px] w-[4px] rounded-[1px] transition-all duration-300"
      style:background-color={isCompleted ? palette.hex : 'var(--border)'}
      style:box-shadow={isCompleted ? `0 0 4px ${palette.glow}` : 'none'}
      style:opacity={isCompleted ? 1 : 0.5}
    ></div>
  {/each}
</div>
