<script lang="ts">
  import { Target } from 'lucide-svelte';
  import { DAILY_TARGET_MIN, DAILY_TARGET_MAX } from '$lib/habits/constants';

  let {
    targetStreak = $bindable(21),
    dailyTarget = $bindable(1),
    selectedColor
  }: {
    targetStreak: number;
    dailyTarget: number;
    selectedColor: { hex: string };
  } = $props();

  const streakRange = $derived({ min: 1, max: 365 });

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  function handleDailyTargetInput(event: Event) {
    const value = parseInt((event.currentTarget as HTMLInputElement).value, 10);
    dailyTarget = isNaN(value) ? DAILY_TARGET_MIN : clamp(value, DAILY_TARGET_MIN, DAILY_TARGET_MAX);
  }

  function handleTargetStreakInput(event: Event) {
    const value = parseInt((event.currentTarget as HTMLInputElement).value, 10);
    targetStreak = isNaN(value) ? 21 : clamp(value, streakRange.min, streakRange.max);
  }

  const dailyRule = $derived(dailyTarget === 1 ? '1 completed repetition = scheduled day complete.' : `${dailyTarget} completed repetitions = scheduled day complete.`);
</script>

<section
  class="rounded-surface border border-border bg-bg-card shadow-surface p-3.5 sm:p-4"
  aria-labelledby="habit-goal-title"
  data-editor-goal
  data-testid="habit-goal-panel"
>
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <h2 id="habit-goal-title" class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Goal</h2>
      <p class="mt-0.5 text-[13px] leading-5 text-muted">Define daily completion and streak target.</p>
    </div>
    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-orange-50 text-orange-500">
      <Target size={17} strokeWidth={1.8} aria-hidden="true" />
    </span>
  </div>

  <div class="mt-3 space-y-3">
    <div class="space-y-1.5">
      <p id="daily-target-label" class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Daily target</p>
      <input
        type="range"
        min={DAILY_TARGET_MIN}
        max={DAILY_TARGET_MAX}
        name="daily-target-slider"
        aria-labelledby="daily-target-label"
        bind:value={dailyTarget}
        class="slider-input w-full"
        style="--accent: {selectedColor.hex};"
        data-editor-goal-daily-range
      />
      <div class="flex items-center gap-2">
        <input
          type="number"
          min={DAILY_TARGET_MIN}
          max={DAILY_TARGET_MAX}
          name="daily-target"
          aria-label="Daily target value"
          inputmode="numeric"
          value={dailyTarget}
          oninput={handleDailyTargetInput}
          class="w-20 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-center text-sm font-mono tabular-nums text-foreground focus:border-accent/50"
          data-editor-goal-daily-number
        />
        <span class="text-[11px] font-mono text-muted">times/day (max {DAILY_TARGET_MAX})</span>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="rounded-2xl border border-border bg-bg-primary p-2.5 leading-snug">
          <p class="text-[13px] font-bold text-foreground" data-editor-goal-daily-metric>{dailyTarget}× / day</p>
          <p class="mt-0.5 text-[10px] leading-[14px] text-muted">required to complete</p>
        </div>
        <div class="rounded-2xl border border-border bg-bg-primary p-2.5 leading-snug">
          <p class="text-[13px] font-bold text-foreground" data-editor-goal-done-metric>{dailyTarget} done</p>
          <p class="mt-0.5 text-[10px] leading-[14px] text-muted">day becomes complete</p>
        </div>
      </div>
    </div>

    <div class="space-y-1.5">
      <p id="target-streak-label" class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Target streak</p>
      <input
        type="range"
        min={streakRange.min}
        max={streakRange.max}
        name="target-streak-slider"
        aria-labelledby="target-streak-label"
        bind:value={targetStreak}
        class="slider-input w-full"
        style="--accent: {selectedColor.hex};"
        data-editor-goal-streak-range
      />
      <div class="flex items-center gap-2">
        <input
          type="number"
          min={streakRange.min}
          max={streakRange.max}
          name="target-streak"
          aria-label="Target streak value"
          inputmode="numeric"
          value={targetStreak}
          oninput={handleTargetStreakInput}
          class="w-20 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-center text-sm font-mono tabular-nums text-foreground focus:border-accent/50"
          data-editor-goal-streak-number
        />
        <span class="text-[11px] font-mono text-muted">days (1–365)</span>
      </div>
    </div>
  </div>
</section>

<section class="rounded-surface border border-border bg-bg-card shadow-surface p-3.5 sm:p-4" data-editor-goal-rule data-testid="habit-goal-rule-card">
  <h2 class="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">Resulting rule</h2>
  <div class="mt-2 rounded-2xl border border-border bg-bg-primary p-2.5">
    <p class="text-[13px] font-bold leading-snug text-foreground" data-editor-goal-rule-text>{dailyRule}</p>
    <p class="mt-0.5 text-[11px] leading-4 text-muted">Streak milestone: {targetStreak} days.</p>
  </div>
</section>
