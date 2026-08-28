<script lang="ts">
  import { addDaysToCalendarDate } from '@habbit-runner/shared';
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import type { HabitHeatmapCell, HistoryDay } from '$lib/stats/modernStats';

  type Props = {
    historyDays: HistoryDay[];
    currentWeek: HistoryDay[];
    currentWeekRate: number | null;
  };

  const { historyDays, currentWeek, currentWeekRate }: Props = $props();

  function toCell(day: HistoryDay): HabitHeatmapCell {
    const scheduled = day.scheduledDays > 0;
    return {
      calendarDate: day.calendarDate,
      state: !scheduled ? 'not scheduled' : day.completedDays > 0 ? 'completed' : 'missed',
      intensity: !scheduled ? 0.55 : day.completedDays > 0 ? Math.min(1, 0.45 + day.completionRate! / 200) : 0.75
    };
  }

  const historyCells = $derived.by(() => {
    const lastHistoryDay = historyDays.at(-1);
    if (!lastHistoryDay) return [];

    const daysByDate = new Map(historyDays.map((day) => [day.calendarDate, day]));
    return Array.from({ length: 84 }, (_, index) => {
      const calendarDate = addDaysToCalendarDate(lastHistoryDay.calendarDate, index - 83);
      const day = daysByDate.get(calendarDate);
      return day ? toCell(day) : { calendarDate, state: 'not scheduled', intensity: 0.55 } satisfies HabitHeatmapCell;
    });
  });
  const weekCells = $derived(currentWeek.map(toCell));
  const firstDate = $derived(historyCells[0]?.calendarDate ?? '12 weeks ago');
  const lastDate = $derived(historyCells.at(-1)?.calendarDate ?? 'today');
</script>

<section class="min-w-0 rounded-2xl border border-border bg-bg-card p-4" aria-labelledby="progress-history-title">
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <div class="flex items-center gap-2">
        <h2 id="progress-history-title" class="text-sm font-semibold text-foreground">12-week history</h2>
        <ChartGuideTooltip title="History" summary="This history always covers the latest 84 calendar days, independent of the selected period." focusPoints={['The full grid is always 12 weeks.', 'Each column is one calendar week.']} variant="grid" triggerClassName="h-8 w-8" />
      </div>
      <div class="mt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-muted">
        Last 12 weeks · scheduled only
      </div>
    </div>
    <div class="shrink-0 text-right">
      <p class="text-[10px] font-mono uppercase tracking-[0.12em] text-muted">This week</p>
      <p class="tabular-nums text-lg font-semibold text-foreground">{currentWeekRate === null ? '—' : `${currentWeekRate}%`}</p>
    </div>
  </div>

  <div class="mt-3" role="list" aria-label="12-week completion history">
    <div
      class="grid grid-flow-col grid-rows-7 gap-1"
      style="grid-template-columns: repeat(12, minmax(0, 1fr));"
    >
      {#each historyCells as cell, index (cell.calendarDate + '-' + index)}
        {@const stateClass = cell.state === 'completed'
          ? 'bg-accent'
          : cell.state === 'missed'
            ? 'bg-danger'
            : 'bg-bg-secondary'}
        <span
          class={`block h-2 min-w-0 rounded-[2px] ${stateClass}`}
          style:opacity={cell.intensity}
          role="listitem"
          aria-label={`${cell.calendarDate}: ${cell.state}`}
          title={`${cell.calendarDate}: ${cell.state}`}
        ></span>
      {/each}
    </div>
    <div class="mt-1 flex justify-between text-[10px] font-mono text-muted">
      <span>{firstDate}</span>
      <span>{lastDate}</span>
    </div>
  </div>
  <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted" aria-label="History legend">
    <span class="font-semibold text-foreground">Legend</span>
    <span class="flex items-center gap-1"><i class="h-2.5 w-2.5 rounded-[3px] bg-accent"></i>More done</span>
    <span class="flex items-center gap-1"><i class="h-2.5 w-2.5 rounded-[3px] bg-accent opacity-55"></i>Some done</span>
    <span class="flex items-center gap-1"><i class="h-2.5 w-2.5 rounded-[3px] bg-danger"></i>More missed</span>
    <span class="flex items-center gap-1"><i class="h-2.5 w-2.5 rounded-[3px] bg-danger opacity-55"></i>Some missed</span>
    <span class="flex items-center gap-1"><i class="h-2.5 w-2.5 rounded-[3px] bg-bg-secondary opacity-55"></i>Not scheduled</span>
  </div>
  <div class="mt-3 border-t border-border/60 pt-3">
    <p class="mb-2 text-[10px] font-mono uppercase tracking-[0.12em] text-muted">Current calendar week</p>
    <div class="grid grid-flow-col grid-rows-1 gap-1.5" style={`grid-template-columns: repeat(${weekCells.length}, minmax(0, 1fr));`} role="list" aria-label="Current week activity">
      {#each weekCells as cell, index (cell.calendarDate + '-' + index)}
        {@const stateClass = cell.state === 'completed'
          ? 'bg-accent'
          : cell.state === 'missed'
            ? 'bg-danger'
            : 'bg-bg-secondary'}
        <span
          class={`block h-2 min-w-0 rounded-[2px] ${stateClass}`}
          style:opacity={cell.state === 'not scheduled' ? Math.max(0.55, cell.intensity) : cell.intensity}
          role="listitem"
          aria-label={`${cell.calendarDate}: ${cell.state}`}
          title={`${cell.calendarDate}: ${cell.state}`}
        ></span>
      {/each}
    </div>
  </div>
</section>
