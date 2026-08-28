<script lang="ts">
  import ChartGuideTooltip from '$lib/components/ChartGuideTooltip.svelte';
  import type { HabitHeatmapCell } from '$lib/stats/modernStats';

  type Props = {
    cells: HabitHeatmapCell[];
    label?: string;
    showGuide?: boolean;
  };

  const { cells, label = 'Activity heatmap', showGuide = false }: Props = $props();

  function cellLabel(cell: HabitHeatmapCell): string {
    return `${cell.calendarDate}: ${cell.state}`;
  }
</script>

<div class="flex min-w-0 items-center gap-2" aria-label={label}>
  {#if showGuide}
    <ChartGuideTooltip
      title="Heatmap"
      summary="Each cell represents one calendar day. Bright completion and miss colors show stronger signals; dark cells were not scheduled."
      focusPoints={['Completed means a scheduled opportunity was done.', 'Missed means a scheduled opportunity was not completed.', 'Not scheduled is intentionally quiet.']}
      variant="grid"
      triggerClassName="h-9 w-9"
    />
  {/if}
  <div
    class="grid min-w-0 flex-1 grid-flow-col grid-rows-1 gap-1 overflow-hidden whitespace-nowrap sm:gap-1.5"
    style={`grid-template-columns: repeat(${cells.length}, minmax(0, 1fr));`}
    role="list"
    aria-label={label}
  >
    {#each cells as cell (cell.calendarDate)}
      {@const stateClass = cell.state === 'completed'
        ? 'bg-accent'
        : cell.state === 'missed'
          ? 'bg-danger'
          : 'bg-bg-secondary'}
      <span
        class={`block aspect-square min-w-0 rounded-[3px] border border-border/40 ${stateClass}`}
        style:opacity={cell.intensity}
        role="listitem"
        aria-label={cellLabel(cell)}
        title={cellLabel(cell)}
      ></span>
    {/each}
  </div>
</div>
