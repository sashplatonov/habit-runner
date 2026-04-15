<script lang="ts">
  import { addDaysToCalendarDate, calendarDateToDate } from '@habbit-runner/shared';
  import { formatAppDate } from '@/lib/i18n';
  import type { HabitColor } from '@/types/habit';
  import { formatDate } from '$lib/habits/habitStats';
  import { DEFAULT_HABIT_COLOR, HABIT_COLOR_THEMES } from '$lib/theme/habit-colors';

  const FILL_OPACITIES = [0, 0.22, 0.46, 0.72, 1] as const;
  const DAYS = 90;
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const TOOLTIP_WIDTH = 200;

  type Cell = {
    date: string;
    intensity: number;
    isToday: boolean;
    isOutOfRange: boolean;
  };

  type TooltipData = {
    x: number;
    y: number;
    date: string;
    habits: string[];
  };

  type Props = {
    completions: Record<string, number>;
    dailyTarget?: number;
    color?: HabitColor;
    compact?: boolean;
    dayDetails?: Record<string, string[]>;
  };

  let {
    completions,
    dailyTarget = 1,
    color = DEFAULT_HABIT_COLOR,
    compact = false,
    dayDetails
  }: Props = $props();

  let tooltip = $state<TooltipData | null>(null);

  function getIntensity(count: number, target: number): number {
    if (count <= 0) {
      return 0;
    }

    const ratio = count / Math.max(1, target);
    if (ratio >= 1) {
      return 4;
    }
    if (ratio >= 0.75) {
      return 3;
    }
    if (ratio >= 0.5) {
      return 2;
    }
    return 1;
  }

  function buildWeeks(entries: Record<string, number>, target: number): Cell[][] {
    const today = formatDate(new Date());
    const rangeStart = addDaysToCalendarDate(today, -(DAYS - 1));
    const rangeStartDate = calendarDateToDate(rangeStart);
    const dayOfWeek = (rangeStartDate.getUTCDay() + 6) % 7;
    const gridStart = addDaysToCalendarDate(rangeStart, -dayOfWeek);
    const weeks: Cell[][] = [];
    let cursor = gridStart;

    while (cursor <= today) {
      const week: Cell[] = [];
      for (let day = 0; day < 7; day += 1) {
        week.push({
          date: cursor,
          intensity: getIntensity(entries[cursor] ?? 0, target),
          isToday: cursor === today,
          isOutOfRange: cursor > today || cursor < rangeStart
        });
        cursor = addDaysToCalendarDate(cursor, 1);
      }
      weeks.push(week);
    }

    return weeks;
  }

  function buildMonthMarkers(weeks: Cell[][]) {
    const markers: Array<{ label: string; index: number }> = [];
    let lastMonth = -1;

    weeks.forEach((week, index) => {
      const month = calendarDateToDate(week[0].date).getUTCMonth();
      if (month !== lastMonth) {
        markers.push({ label: MONTH_NAMES[month], index });
        lastMonth = month;
      }
    });

    return markers;
  }

  function cellStyle(cell: Cell, accentHex: string, glow: string): string {
    if (cell.isOutOfRange) {
      return 'background-color: transparent; opacity: 0;';
    }
    if (cell.intensity === 0) {
      return 'background-color: var(--border); opacity: 0.5;';
    }
    return `background-color: ${accentHex}; opacity: ${FILL_OPACITIES[cell.intensity]}; box-shadow: 0 0 4px ${glow};`;
  }

  function formatTooltipDate(date: string) {
    return formatAppDate(calendarDateToDate(date), {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }

  function tooltipLeft(rectLeft: number): number {
    const max = window.innerWidth - TOOLTIP_WIDTH - 8;
    return Math.min(rectLeft + 8, max);
  }

  const weeks = $derived(buildWeeks(completions, dailyTarget));
  const monthMarkers = $derived(buildMonthMarkers(weeks));
  const palette = $derived(HABIT_COLOR_THEMES[color]);
  const weekCount = $derived(weeks.length);
</script>

{#if compact}
  <div
    class="grid gap-[2px]"
    style:grid-template-columns={`repeat(${weekCount}, 4px)`}
    style:grid-template-rows="repeat(7, 4px)"
    style:grid-auto-flow="column"
  >
    {#each weeks.flat() as cell, cellIdx (cell.date + '-' + cellIdx)}
      <div
        class="h-[4px] w-[4px] rounded-[1px]"
        style={cellStyle(cell, palette.hex, palette.glow)}
        style:outline={cell.isToday && !cell.isOutOfRange ? `1px solid ${palette.hex}` : 'none'}
        style:outline-offset="1px"
      ></div>
    {/each}
  </div>
{:else}
  <div class="relative select-none sm:mx-auto sm:max-w-[320px]">
    <div class="flex w-full gap-0">
      <div class="mr-1.5 grid shrink-0 gap-1 sm:gap-1.5" style:width="16px" style:grid-template-rows="repeat(7, minmax(0, 1fr))">
        {#each ['M', '', 'W', '', 'F', '', ''] as label, index (`day-${index}`)}
          <div class="flex items-center text-[9px] font-mono text-muted">{label}</div>
        {/each}
      </div>

      <div class="grid flex-1 gap-1 sm:gap-1.5" style:grid-template-columns={`repeat(${weekCount}, minmax(0, 1fr))`}>
        {#each weeks as week, weekIdx (week[0].date + '-' + weekIdx)}
          <div class="grid gap-1 sm:gap-1.5" style:grid-template-rows="repeat(7, minmax(0, 1fr))">
            {#each week as cell, ci (cell.date + '-' + ci)}
              <button
                type="button"
                class="aspect-square w-full rounded-[2px] transition-transform hover:scale-110"
                aria-label={cell.isOutOfRange ? undefined : `Activity for ${cell.date}`}
                disabled={cell.isOutOfRange}
                style={cellStyle(cell, palette.hex, palette.glow)}
                style:outline={cell.isToday && !cell.isOutOfRange ? `1px solid ${palette.hex}` : 'none'}
                style:outline-offset="1px"
                onmouseenter={(event) => {
                  if (cell.isOutOfRange) {
                    return;
                  }

                  const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  tooltip = {
                    x: tooltipLeft(rect.left),
                    y: rect.top - 36,
                    date: cell.date,
                    habits: dayDetails?.[cell.date] ?? []
                  };
                }}
                onmouseleave={() => {
                  tooltip = null;
                }}
              ></button>
            {/each}
          </div>
        {/each}
      </div>
    </div>

    {#if monthMarkers.length > 0}
      <div class="relative ml-[18px] mt-1 h-4 overflow-hidden">
        {#each monthMarkers as marker (`${marker.label}-${marker.index}`)}
          <span class="absolute text-[9px] font-mono text-muted" style:left={`${(marker.index / weekCount) * 100}%`}>
            {marker.label}
          </span>
        {/each}
      </div>
    {/if}

    {#if tooltip}
      <div
        class="fixed z-50 rounded border border-border bg-bg-card px-3 py-2 text-[10px] font-mono text-foreground shadow-lg"
        style:left={`${tooltip.x}px`}
        style:top={`${tooltip.y}px`}
        style:max-width={`${TOOLTIP_WIDTH}px`}
      >
        <p class="mb-1 text-[10px] font-mono text-muted">{formatTooltipDate(tooltip.date)}</p>
        {#if tooltip.habits.length > 0}
          {#each tooltip.habits as habitLabel, index (`${tooltip.date}-${index}`)}
            <p class="text-[11px] font-mono text-foreground">{habitLabel}</p>
          {/each}
        {:else}
          <p class="text-[10px] font-mono text-muted">No habits finished that day.</p>
        {/if}
      </div>
    {/if}
  </div>
{/if}
