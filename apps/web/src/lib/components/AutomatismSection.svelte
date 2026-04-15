<script lang="ts">
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import {
    getAutomatismColor,
    getAutomatismLevel,
    getAutomatismMessage
  } from '$lib/habits/detailHints';
  import type { HabitColorTheme } from '$lib/theme/habit-colors';

  type Props = {
    score: number;
    accent: HabitColorTheme;
  };

  const { score, accent }: Props = $props();

  const level = $derived(getAutomatismLevel(score, accent.hex));
  const message = $derived(getAutomatismMessage(score));
  const messageColor = $derived(getAutomatismColor(score));
</script>

<div class="rounded-xl border border-border bg-bg-secondary p-4">
  <div class="mb-3 flex items-center justify-between">
    <div class="flex flex-col">
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-mono uppercase tracking-widest text-muted">Habit strength</span>
        <ChartGuideTooltip
          title="Habit strength"
          summary="Automatism estimates how embedded this habit already is, so you can judge whether the routine is fragile, growing, or close to autopilot."
          focusPoints={[
            'Higher score: less friction and more repeatable execution.',
            'Level badge: quick read on the current maturity stage.',
            'Use drops in this block as a signal to simplify timing or target.'
          ]}
          variant="line"
          triggerClassName="h-7 w-7"
        />
      </div>
      <span class="text-lg font-bold text-foreground">Automatism: {score}%</span>
    </div>

    <div
      class="rounded border px-2 py-0.5 text-[10px] font-mono font-bold uppercase"
      style:border-color={level.color}
      style:color={level.color}
    >
      {level.label}
    </div>
  </div>

  <div class="h-2 overflow-hidden rounded-full bg-border">
    <div
      class="h-full transition-all duration-1000 ease-out"
      style:width="{score}%"
      style:background-color={accent.hex}
      style:box-shadow="0 0 10px {accent.glow}"
    ></div>
  </div>

  <div class="mt-2 text-[10px] font-mono leading-relaxed" style:color={messageColor}>
    {message}
  </div>
</div>