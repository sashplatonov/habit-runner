<script lang="ts">
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import ProgressHeatmapStrip from '$lib/components/stats/ProgressHeatmapStrip.svelte';
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
      intensity: !scheduled ? 0.2 : day.completedDays > 0 ? Math.min(1, 0.45 + day.completionRate! / 200) : 0.75
    };
  }

  const historyCells = $derived(historyDays.map(toCell));
  const weekCells = $derived(currentWeek.map(toCell));
  const firstDate = $derived(historyDays[0]?.calendarDate ?? '12 weeks ago');
  const lastDate = $derived(historyDays.at(-1)?.calendarDate ?? 'today');
</script>

<section class="min-w-0 rounded-2xl border border-border bg-bg-card p-4" aria-labelledby="progress-history-title">
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <div class="flex items-center gap-2">
        <h2 id="progress-history-title" class="text-sm font-semibold text-foreground">12-week history</h2>
        <ChartGuideTooltip title="History" summary="This history always covers the latest 84 calendar days, independent of the selected period." focusPoints={['The full strip is always 12 weeks.', 'The highlighted strip shows the current calendar week.']} variant="grid" triggerClassName="h-9 w-9" />
      </div>
      <div class="mt-2 flex justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.12em] text-muted">
        <span>{firstDate}</span>
        <span>Today · {lastDate}</span>
      </div>
    </div>
    <div class="shrink-0 text-right">
      <p class="text-[10px] font-mono uppercase tracking-[0.12em] text-muted">This week</p>
      <p class="tabular-nums text-lg font-semibold text-foreground">{currentWeekRate === null ? '—' : `${currentWeekRate}%`}</p>
    </div>
  </div>

  <div class="mt-3">
    <ProgressHeatmapStrip cells={historyCells} label="12-week completion history" />
  </div>
  <div class="mt-3 flex items-center gap-3 text-[10px] text-muted" aria-label="History legend">
    <span class="font-semibold text-foreground">Legend</span>
    <span class="flex items-center gap-1"><i class="h-2.5 w-2.5 rounded-[3px] bg-accent"></i>Completed</span>
    <span class="flex items-center gap-1"><i class="h-2.5 w-2.5 rounded-[3px] bg-danger opacity-75"></i>Missed</span>
    <span class="flex items-center gap-1"><i class="h-2.5 w-2.5 rounded-[3px] bg-bg-secondary"></i>Not scheduled</span>
  </div>
  <div class="mt-3 border-t border-border/60 pt-3">
    <p class="mb-2 text-[10px] font-mono uppercase tracking-[0.12em] text-muted">Current calendar week</p>
    <ProgressHeatmapStrip cells={weekCells} label="Current week activity" />
  </div>
</section>
