<script lang="ts">
  import type { HabitHeatmapCell } from '$lib/stats/modernStats';

  type Props = {
    cells: HabitHeatmapCell[];
    label?: string;
  };

  const { cells, label = 'Activity heatmap' }: Props = $props();

  function cellLabel(cell: HabitHeatmapCell): string {
    return `${cell.calendarDate}: ${cell.state}`;
  }

  function displayOpacity(cell: HabitHeatmapCell): number {
    return cell.state === 'not scheduled' ? Math.max(0.55, cell.intensity) : cell.intensity;
  }
</script>

<div class="flex min-w-0 items-center gap-2" aria-label={label}>
  <div
    class="grid min-w-0 flex-1 grid-flow-col grid-rows-1 gap-1 overflow-hidden whitespace-nowrap sm:gap-1.5"
    style={`grid-template-columns: repeat(${cells.length}, minmax(0, 1fr));`}
    role="list"
    aria-label={label}
  >
    {#each cells as cell, index (cell.calendarDate + '-' + index)}
      {@const stateClass = cell.state === 'completed'
        ? 'bg-accent'
        : cell.state === 'missed'
          ? 'bg-danger'
          : 'bg-bg-secondary'}
      <span
        class={`block h-2 min-w-0 rounded-[2px] ${stateClass}`}
        style:opacity={displayOpacity(cell)}
        role="listitem"
        aria-label={cellLabel(cell)}
        title={cellLabel(cell)}
      ></span>
    {/each}
  </div>
</div>
