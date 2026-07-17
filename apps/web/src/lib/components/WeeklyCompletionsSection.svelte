<script lang="ts">
  import type { HabitStats } from '@/types/habit';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import { buildWeeklyInsight } from '$lib/habits/detailHints';
  import type { HabitColorTheme } from '$lib/theme/habit-colors';

  type Props = {
    weeklyData: HabitStats['weeklyData'];
    accent: HabitColorTheme;
    habitCreatedAt: string;
  };

  const { weeklyData, accent, habitCreatedAt }: Props = $props();

  let hoveredIndex = $state<number | null>(null);

  const activeIndex = $derived(hoveredIndex ?? (weeklyData.length > 0 ? weeklyData.length - 1 : null));
  const activeWeek = $derived(activeIndex === null ? null : weeklyData[activeIndex] ?? null);
  const insight = $derived(buildWeeklyInsight(weeklyData, habitCreatedAt));
  const InsightIcon = $derived(insight.icon);
</script>

<div class="rounded-surface border border-border bg-bg-card p-4 shadow-surface">
  <div class="mb-3 flex items-center gap-2">
    <h2 class="text-xs font-mono uppercase tracking-wider text-muted">Weekly completions</h2>
    <ChartGuideTooltip
      title="Weekly completions"
      summary="This mini chart compares week-by-week volume, which is useful for seeing whether the habit is holding steady in the short term."
      focusPoints={[
        'Taller recent bars: improving short-term follow-through.',
        'Falling bars: momentum loss before it shows up in streaks.',
        'Last week count: the clearest signal of current traction.'
      ]}
      variant="columns"
    />
  </div>

  <div class="flex h-16 items-end gap-1">
    {#each weeklyData as week, weekIndex (week.week + '-' + weekIndex)}
      <button
        type="button"
        class="flex-1 rounded-sm transition-all"
        style:height="{Math.max(2, (Math.min(7, week.count) / 7) * 100)}%"
        style:min-height="2px"
        style:background-color={accent.hex}
        style:opacity="{0.4 + (weekIndex / Math.max(1, weeklyData.length)) * 0.6}"
        style:box-shadow={activeIndex === weekIndex ? `0 0 8px ${accent.glow}` : 'none'}
        onclick={() => {
          hoveredIndex = weekIndex;
        }}
        onmouseenter={() => {
          hoveredIndex = weekIndex;
        }}
        onfocus={() => {
          hoveredIndex = weekIndex;
        }}
        aria-label="{week.week}: {week.count} completions"
      ></button>
    {/each}
  </div>

  <div class="mb-2 mt-1 flex justify-between">
    <span class="text-[9px] font-mono text-muted">12w ago</span>
    <span class="text-[9px] font-mono text-muted">this week</span>
  </div>

  {#if activeWeek}
    <div class="mb-2 flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-card px-3 py-2">
      <div class="min-w-0">
        <p class="text-[9px] font-mono uppercase tracking-[0.2em] text-muted">Focused week</p>
        <p class="truncate text-xs font-semibold text-foreground">{activeWeek.week}</p>
      </div>
      <span class="text-sm font-mono font-bold" style:color={accent.hex}>{activeWeek.count}/7</span>
    </div>
  {/if}

  {#if insight.text}
    <div class="flex items-center gap-1" style:color={insight.color}>
      <InsightIcon size={10} class="flex-shrink-0" />
      <p class="text-[10px] font-mono">{insight.text}</p>
    </div>
  {/if}
</div>
