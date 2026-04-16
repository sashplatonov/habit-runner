<script lang="ts">
  import type { Habit, HabitStats } from '@/types/habit';
  import CompletionRing from '$lib/components/CompletionRing.svelte';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import type { HabitColorTheme } from '$lib/theme/habit-colors';

  type Props = {
    stats: Pick<HabitStats, 'currentStreak' | 'completionRate'>;
    habit: Habit;
    accent: HabitColorTheme;
  };

  const { stats, habit, accent }: Props = $props();

  const targetStreak = $derived(Math.max(1, habit.targetStreak ?? 30));
  const remainingDays = $derived(Math.max(0, targetStreak - stats.currentStreak));
  const progressWidth = $derived(Math.min(100, (stats.currentStreak / targetStreak) * 100));
  const streakHint = $derived.by(() => {
    if (stats.currentStreak >= targetStreak) {
      return `Target reached! Set a new challenge.`;
    }
    if (stats.currentStreak === 0) {
      return `Start today - ${targetStreak} days to reach your target.`;
    }
    return `${remainingDays} more day${remainingDays === 1 ? '' : 's'} to hit your ${targetStreak}-day target.`;
  });
  const streakHintColor = $derived(
    stats.currentStreak >= targetStreak
      ? 'text-accent'
      : stats.currentStreak > targetStreak * 0.5
        ? 'text-accent-secondary'
        : 'text-muted'
  );
</script>

<div class="flex items-center gap-4 rounded-lg border border-border bg-bg-secondary p-4">
  <CompletionRing percentage={stats.completionRate} size={72} strokeWidth={5} color={habit.color} showText={true} />

  <div class="min-w-0 flex-1">
    <div class="mb-2 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono text-muted">Target streak</span>
        <ChartGuideTooltip
          title="Target streak"
          summary="This block compares your current live streak against the streak target you set for this habit."
          focusPoints={[
            'Ring: overall completion reliability for the habit.',
            'Bar: live progress toward the chosen streak target.',
            'Tags: context cues tied to this habit.'
          ]}
          variant="bars"
          triggerClassName="h-7 w-7"
        />
      </div>
      <span class="text-xs font-mono" style:color={accent.hex}>{stats.currentStreak}/{targetStreak}d</span>
    </div>

    <div class="mb-2 h-1.5 overflow-hidden rounded-full bg-border">
      <div
        class="h-full rounded-full transition-all duration-700"
        style:width="{progressWidth}%"
        style:background-color={accent.hex}
        style:box-shadow="0 0 8px {accent.glow}"
      ></div>
    </div>

    <p class="mb-2 text-[9px] font-mono {streakHintColor}">{streakHint}</p>

    {#if habit.tags.length > 0}
      <div class="flex flex-wrap gap-2">
        {#each habit.tags as tag, tagIndex (tag + '-' + tagIndex)}
          <span class="inline-flex items-center gap-1 rounded border border-border bg-bg-card px-2 py-0.5 text-[10px] font-mono text-foreground">
            <span class="h-1.5 w-1.5 rounded-full" style:background-color={accent.hex}></span>
            {tag}
          </span>
        {/each}
      </div>
    {/if}
  </div>
</div>