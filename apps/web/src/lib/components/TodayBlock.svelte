<script lang="ts">
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import type { HabitColorTheme } from '$lib/theme/habit-colors';

  type Props = {
    dailyTarget: number;
    todayCompletionCount: number;
    accent: HabitColorTheme;
  };

  const { dailyTarget, todayCompletionCount, accent }: Props = $props();
</script>

<div class="rounded-surface border border-border bg-bg-card p-4 shadow-surface">
  <div class="mb-2 flex items-center gap-2">
    <div class="text-[11px] font-mono uppercase tracking-[0.5em] text-muted">Today</div>
    <ChartGuideTooltip
      title="Today progress"
      summary="This block tells you how much of today's quota is already complete for this habit and whether you still need more repetitions."
      focusPoints={[
        'Current count versus target: how far you are from done today.',
        'Use the +1 and -1 controls above to correct today instantly.',
        'If the target is higher than 1, keep logging until the quota is filled.'
      ]}
      variant="bars"
      triggerClassName="h-7 w-7"
    />
  </div>

  <p class="text-sm text-foreground">
    Completed <span class="font-mono font-bold" style:color={accent.hex}>{todayCompletionCount}</span> / {dailyTarget} today.
  </p>
  <p class="mt-1 text-[11px] text-muted">Reminder settings are available on the edit screen.</p>
</div>
