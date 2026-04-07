<script lang="ts">
  import { HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';
  import type { HabitColor } from '$lib/types/habit';
  import { formatDate } from '$lib/habits/habitStats';

  let {
    completions,
    dailyTarget = 1,
    color
  }: {
    completions: Record<string, number>;
    dailyTarget?: number;
    color: HabitColor;
  } = $props();

  const today = new Date();
  const days: Date[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  const startDay = days[0].getDay();
  const emptyCells = Array.from({ length: startDay });
  const { hex, glow } = HABIT_COLOR_THEMES[color];
</script>

<div class="grid grid-rows-7 grid-flow-col gap-[2px]">
  {#each emptyCells as _, i}
    <div class="w-[4px] h-[4px] rounded-[1px] bg-transparent"></div>
  {/each}
  {#each days as date}
    {@const dateStr = formatDate(date)}
    {@const isCompleted = (completions[dateStr] ?? 0) >= dailyTarget}
    <div
      class="w-[4px] h-[4px] rounded-[1px] transition-all duration-300"
      style="background-color: {isCompleted ? hex : 'var(--border)'}; box-shadow: {isCompleted ? `0 0 4px ${glow}` : 'none'}; opacity: {isCompleted ? 1 : 0.5}"
    ></div>
  {/each}
</div>
