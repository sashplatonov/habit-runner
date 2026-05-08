<script lang="ts">
  import { DAILY_TARGET_MIN, DAILY_TARGET_MAX } from '$lib/habits/constants';
  import type { FormValues } from '../HabitForm.svelte';

  let {
    targetStreak = $bindable(21),
    dailyTarget = $bindable(1),
    selectedColor
  }: {
    targetStreak: number;
    dailyTarget: number;
    selectedColor: { value: string; label: string; hex: string };
  } = $props();

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  function handleDailyTargetInput(event: Event) {
    const value = parseInt((event.currentTarget as HTMLInputElement).value, 10);
    dailyTarget = isNaN(value) ? DAILY_TARGET_MIN : clamp(value, DAILY_TARGET_MIN, DAILY_TARGET_MAX);
  }

  function handleTargetStreakInput(event: Event) {
    const value = parseInt((event.currentTarget as HTMLInputElement).value, 10);
    targetStreak = isNaN(value) ? 21 : clamp(value, 1, 365);
  }
</script>

<div class="rounded-[1.75rem] border border-border bg-bg-card/92 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.08)]">
  <p class="mb-2 block text-[10px] font-mono uppercase tracking-wider text-muted">Daily Target</p>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
    <input
      type="range"
      min={DAILY_TARGET_MIN}
      max={DAILY_TARGET_MAX}
      bind:value={dailyTarget}
      class="slider-input flex-1"
      style="--accent: {selectedColor.hex};"
    />
    <input
      type="number"
      min={DAILY_TARGET_MIN}
      max={DAILY_TARGET_MAX}
      value={dailyTarget}
      oninput={handleDailyTargetInput}
      class="w-20 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-center text-sm font-mono tabular-nums text-foreground transition-all focus:border-accent/50"
    />
    <span class="text-[10px] font-mono text-muted">times/day</span>
  </div>

  <p class="mb-2 mt-4 block text-[10px] font-mono uppercase tracking-wider text-muted">Target Streak</p>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
    <input
      type="range"
      min="1"
      max="365"
      bind:value={targetStreak}
      class="slider-input flex-1"
      style="--accent: {selectedColor.hex};"
    />
    <input
      type="number"
      min="1"
      max="365"
      value={targetStreak}
      oninput={handleTargetStreakInput}
      class="w-20 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-center text-sm font-mono tabular-nums text-foreground transition-all focus:border-accent/50"
    />
    <span class="text-[10px] font-mono text-muted">days</span>
  </div>
</div>
