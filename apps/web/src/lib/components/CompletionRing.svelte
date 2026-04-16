<script lang="ts">
  import type { HabitColor } from '@habbit-runner/shared';
  import { DEFAULT_HABIT_COLOR, HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';

  type Props = {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: HabitColor;
    showText?: boolean;
    className?: string;
  };

  let {
    percentage,
    size = 40,
    strokeWidth = 3,
    color = DEFAULT_HABIT_COLOR,
    showText = false,
    className = ''
  }: Props = $props();

  const clampedPercentage = $derived(Math.min(percentage, 100));
  const radius = $derived((size - strokeWidth * 2) / 2);
  const circumference = $derived(radius * 2 * Math.PI);
  const offset = $derived(circumference - (clampedPercentage / 100) * circumference);
  const palette = $derived(HABIT_COLOR_THEMES[color]);
  const isFull = $derived(percentage >= 100);
  const ringStroke = $derived(isFull ? 'var(--accent-secondary)' : palette.hex);
  const ringFilter = $derived.by(() => {
    if (percentage <= 0) {
      return 'none';
    }
    return `drop-shadow(0 0 ${isFull ? 8 : 4}px ${isFull ? 'var(--glow-secondary)' : palette.glow})`;
  });
  const textColor = $derived(isFull ? 'var(--accent-secondary)' : palette.hex);
</script>

<div class={`relative inline-flex items-center justify-center ${isFull ? 'animate-ring-celebrate' : ''} ${className}`}>
  <svg width={size} height={size} class="-rotate-90">
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill="none"
      stroke="var(--border)"
      stroke-width={strokeWidth}
    ></circle>

    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill="none"
      stroke={ringStroke}
      stroke-width={strokeWidth}
      stroke-dasharray={circumference}
      stroke-dashoffset={offset}
      stroke-linecap="round"
      style:filter={ringFilter}
      style:transition="stroke-dashoffset 0.6s ease, stroke 0.4s ease"
    ></circle>
  </svg>

  {#if showText}
    <span class="absolute text-[10px] font-mono font-bold" style:color={textColor}>
      {Math.round(percentage)}
    </span>
  {/if}
</div>
